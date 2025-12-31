'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaClock, FaCheckToSlot, FaTruckRampBox, FaWarehouse } from 'react-icons/fa6';

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const statusStyles = {
  paid: {
    badge: 'bg-cyan-100 text-emerald-800',
    label: 'Pagado',
  },
  unpaid: {
    badge: 'bg-amber-100 text-amber-800',
    label: 'Pendiente de pago',
  },
  canceled: {
    badge: 'bg-rose-100 text-rose-800',
    label: 'Cancelado',
  },
};

const fulfillmentStages = [
  { key: 'en_proceso', label: 'En proceso', icon: FaClock },
  { key: 'pedido_confirmado', label: 'Pedido confirmado', icon: FaCheckToSlot },
  { key: 'en_camino', label: 'Finalizado', icon: FaWarehouse },
];

const getNextStage = (current) => {
  if (current === 'en_camino') return fulfillmentStages[fulfillmentStages.length - 1];
  const index = fulfillmentStages.findIndex((stage) => stage.key === current);
  const nextIndex = Math.min(index + 1, fulfillmentStages.length - 1);
  return fulfillmentStages[Math.max(nextIndex, 0)];
};

export default function OrdersDashboard({
  orders,
  dashboardToken,
  requirePin = true,
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [items, setItems] = useState(orders);
  const [updatingId, setUpdatingId] = useState(null);
  const [noteUpdatingId, setNoteUpdatingId] = useState(null);
  const [returnUpdatingId, setReturnUpdatingId] = useState(null);
  const [resetUpdatingId, setResetUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [pinValue, setPinValue] = useState('');
  const [hasAccess, setHasAccess] = useState(!requirePin);
  const [pinError, setPinError] = useState(null);

  useEffect(() => {
    setItems(orders);
  }, [orders]);

  const filteredOrders = useMemo(
    () =>
      items.filter((order) =>
        activeTab === 'completed' ? order.isCompleted : !order.isCompleted
      ),
    [activeTab, items]
  );

  const mergeOrder = (order, payload) => ({
    ...order,
    fulfillmentStatus: payload.fulfillmentStatus ?? order.fulfillmentStatus,
    isCompleted:
      payload.fulfillmentCompleted !== undefined
        ? payload.fulfillmentCompleted
        : order.isCompleted,
    fulfillmentReturn:
      payload.fulfillmentReturn !== undefined
        ? payload.fulfillmentReturn
        : order.fulfillmentReturn,
    fulfillmentNote:
      payload.fulfillmentNote !== undefined
        ? payload.fulfillmentNote
        : order.fulfillmentNote,
  });

  const applyServerUpdate = (orderId, payload) => {
    setItems((prev) =>
      prev.map((item) => (item.id === orderId ? mergeOrder(item, payload) : item))
    );
  };

  const persistLogistics = async (orderId, payload) => {
    const response = await fetch('/api/orders/logistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(dashboardToken ? { 'x-dashboard-token': dashboardToken } : {}),
      },
      body: JSON.stringify({ sessionId: orderId, ...payload }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error ?? 'No se pudo actualizar el estado interno.');
    }
    applyServerUpdate(orderId, {
      fulfillmentReturn:
        result.returnStatus === undefined ? undefined : result.returnStatus,
      fulfillmentNote:
        result.note === undefined ? undefined : result.note,
    });
    return result;
  };

  const handleStatusToggle = async (order) => {
    if (order.isCompleted) return;
    const isFinalStage =
      order.fulfillmentStatus === 'pedido_confirmado' ||
      order.fulfillmentStatus === 'en_camino';
    const nextStage = getNextStage(order.fulfillmentStatus);
    const targetStatus = isFinalStage ? undefined : nextStage.key;
    const hadReturn = order.fulfillmentReturn === 'devolucion';
    setUpdatingId(order.id);
    setFeedback(null);
    try {
      const bodyPayload = isFinalStage
        ? { sessionId: order.id, complete: true }
        : { sessionId: order.id, status: targetStatus };
      const response = await fetch('/api/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(dashboardToken ? { 'x-dashboard-token': dashboardToken } : {}),
        },
        body: JSON.stringify(bodyPayload),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'No se pudo actualizar');
      }
      applyServerUpdate(order.id, {
        fulfillmentStatus: payload.fulfillmentStatus,
        fulfillmentCompleted: isFinalStage ? true : false,
      });
      if (hadReturn) {
        await persistLogistics(order.id, { returnStatus: null });
      }
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Hubo un error al cambiar el estado.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetOrder = async (order) => {
    setResetUpdatingId(order.id);
    setFeedback(null);
    try {
      const response = await fetch('/api/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(dashboardToken ? { 'x-dashboard-token': dashboardToken } : {}),
        },
        body: JSON.stringify({ sessionId: order.id, reset: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? 'No se pudo reactivar');
      applyServerUpdate(order.id, {
        fulfillmentStatus: 'en_proceso',
        fulfillmentCompleted: false,
        fulfillmentReturn: null,
        fulfillmentNote: payload.fulfillmentNote,
      });
      await persistLogistics(order.id, { returnStatus: null });
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      setActiveTab('pending');
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Hubo un error al reactivar el pedido.'
      );
    } finally {
      setResetUpdatingId(null);
    }
  };

  const handleReturnToggle = async (order) => {
    setReturnUpdatingId(order.id);
    setFeedback(null);
    const targetReturn =
      order.fulfillmentReturn === 'devolucion' ? null : 'devolucion';
    setItems((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              fulfillmentReturn: targetReturn,
              isCompleted:
                targetReturn === 'devolucion'
                  ? item.isCompleted
                  : item.isCompleted || item.fulfillmentStatus === 'en_camino',
            }
          : item
      )
    );
    try {
      await persistLogistics(order.id, { returnStatus: targetReturn });
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Hubo un error al actualizar la devolución.'
      );
    } finally {
      setReturnUpdatingId(null);
    }
  };

  const handleAddNote = async (order, note) => {
    setNoteUpdatingId(order.id);
    setFeedback(null);
    try {
      await persistLogistics(order.id, { note });
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Hubo un error al guardar la nota.'
      );
    } finally {
      setNoteUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {!hasAccess ? (
        <div className="max-w-md mx-auto rounded-3xl border border-[rgb(var(--color-text))]/15 bg-[rgb(var(--color-bg))] shadow px-6 py-8 text-center space-y-4 mt-12">
          <h2 className="text-2xl font-semibold linear-text-title">
            Ingresa el código de acceso
          </h2>
          <p className="text-sm text-[rgb(var(--color-text))]/70">
            Este panel contiene información sensible de pedidos. Introduce tu PIN para continuar.
          </p>
          <input
            type="password"
            value={pinValue}
            onChange={(event) => setPinValue(event.target.value)}
            maxLength={6}
            className="w-full rounded-2xl border border-[rgb(var(--color-text))]/20 bg-transparent px-4 py-3 text-center text-lg tracking-[0.7em] font-semibold focus:border-cyan-400 focus:outline-none"
            placeholder="••••••"
          />
          <button
            onClick={() => {
              if (pinValue === '139722') {
                setHasAccess(true);
                setPinError(null);
              } else {
                setPinError('Código incorrecto, intenta nuevamente.');
              }
            }}
            className="w-full rounded-full bg-[rgb(var(--color-text))] text-[rgb(var(--color-card))] font-semibold py-3 px-5 shadow hover:bg-[rgb(var(--color-text))]/90 transition"
          >
            Desbloquear
          </button>
          {pinError && <p className="text-sm text-red-500">{pinError}</p>}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {['pending', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]/70 border border-[rgb(var(--color-text))]/10'
                }`}
              >
                {tab === 'pending' ? 'Pendientes' : 'Completados'}
              </button>
            ))}
          </div>
          {feedback && <p className="text-sm text-red-600">{feedback}</p>}
          <div className="mt-6 space-y-6">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-[rgb(var(--color-text))]/15 bg-[rgb(var(--color-bg))] px-6 py-12 text-center text-[rgb(var(--color-text))]/60">
                Aún no hay pedidos confirmados.
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-[rgb(var(--color-text))]/15 bg-[rgb(var(--color-bg))] px-6 py-12 text-center text-[rgb(var(--color-text))]/60">
                No hay registros en esta sección.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredOrders.map((order) => {
                  const style = statusStyles[order.status] ?? statusStyles.unpaid;
                  const isFinalStage =
                    order.fulfillmentStatus === 'pedido_confirmado' ||
                    order.fulfillmentStatus === 'en_camino';
                  const nextStage = getNextStage(order.fulfillmentStatus);
                  const logisticState = (() => {
                    if (order.fulfillmentReturn === 'devolucion') {
                      return {
                        label: 'Devolución',
                        badgeClass: 'bg-rose-100 text-rose-800',
                        icon: FaTruckRampBox,
                      };
                    }
                    if (order.isCompleted) {
                      return {
                        label: 'Finalizado',
                        badgeClass: 'bg-emerald-100 text-emerald-800',
                        icon: FaWarehouse,
                      };
                    }
                    const stageInfo =
                      fulfillmentStages.find((stage) => stage.key === order.fulfillmentStatus) ||
                      fulfillmentStages[0];
                    return {
                      label: stageInfo.label,
                      badgeClass: 'bg-slate-100 text-slate-800',
                      icon: stageInfo.icon,
                    };
                  })();
                  const displayStatus = order.isCompleted
                    ? 'en_camino'
                    : order.fulfillmentStatus === 'en_camino'
                    ? 'pedido_confirmado'
                    : order.fulfillmentStatus;
                  return (
                    <article
                      key={order.id}
                      className="rounded-3xl border border-[rgb(var(--color-text))]/10 bg-[rgb(var(--color-bg))] p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--color-text))]/10 pb-4">
                        <div className="flex flex-col items-start justify-start my-2">
                          <p className="text-xs uppercase font-semibold text-[rgb(var(--color-text))]/60">
                            Folio corto
                          </p>
                          <p className="text-lg font-bold linear-text-title break-all">
                            {order.friendlyFolio ?? order.id}
                          </p>
                          <p className="text-xs text-[rgb(var(--color-text))]/50 break-all">
                            {order.id}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
                            {style.label}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${logisticState.badgeClass}`}
                          >
                            {logisticState.icon && <logisticState.icon className="text-base" />}
                            {logisticState.label}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[rgb(var(--color-text))]/80 py-4">
                        <div>
                          <p className="font-semibold text-[rgb(var(--color-text))]">Teléfono</p>
                          <p className="wrap-break-word">{order.contactPhone ?? 'Sin registro'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--color-text))]">Correo</p>
                          <p className="wrap-break-word">{order.email ?? 'Sin registro'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--color-text))]">Domicilio</p>
                          <p className="wrap-break-word">
                            {order.contactAddress ?? 'Sin registro'}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--color-text))]">Fecha</p>
                          <p>
                            {new Date(order.created * 1000).toLocaleDateString('es-MX', {
                              dateStyle: 'medium',
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--color-text))]">Total</p>
                          <p className="font-bold text-lg linear-text-title">
                            {money.format(order.amount / 100)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--color-text))]">Moneda</p>
                          <p>{order.currency}</p>
                        </div>
                      </div>
                      <div className="py-4 border-t border-b border-[rgb(var(--color-text))]/10">
                        <p className="text-xs font-semibold uppercase text-[rgb(var(--color-text))]/60 mb-2">
                          Artículos
                        </p>
                        <ul className="space-y-2 text-sm text-[rgb(var(--color-text))]/80">
                          {order.lineItems.map((item, idx) => (
                            <li key={`${order.id}-${idx}`} className="flex justify-between gap-3">
                              <span className="font-medium truncate">{item.description}</span>
                              <span className="whitespace-nowrap">
                                {item.quantity} x {money.format(item.total / 100)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[rgb(var(--color-text))]/70 flex-1">
                          {fulfillmentStages.map((stage) => {
                            const StageIcon = stage.icon;
                            return (
                              <div
                                key={`${order.id}-stage-${stage.key}`}
                                className={`flex flex-col items-center rounded-2xl p-1 text-center ${
                                  displayStatus === stage.key
                                    ? 'shadow shadow-cyan-400/50 bg-cyan-50 text-cyan-700'
                                    : 'shadow shadow-[rgb(var(--color-text))]/10 text-[rgb(var(--color-text))]/70'
                                }`}
                              >
                                <StageIcon className="text-base mb-1" />
                                {stage.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 pt-4">
                        {activeTab === 'pending' ? (
                          <div className="flex">
                            <button
                              onClick={() => handleStatusToggle(order)}
                              disabled={updatingId === order.id || order.isCompleted}
                              className={`w-full rounded-full px-4 py-2 text-sm font-semibold shadow transition cursor-pointer ${
                                isFinalStage
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              } disabled:opacity-50`}
                            >
                              {updatingId === order.id
                                ? 'Actualizando...'
                                : order.isCompleted
                                ? 'Finalizado'
                                : isFinalStage
                                ? 'Finalizar'
                                : `Ir a "${nextStage.label}"`}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div className="rounded-2xl border border-[rgb(var(--color-text))]/10 bg-[rgb(var(--color-card))] px-4 py-3 text-sm text-[rgb(var(--color-text))]/80 w-full">
                              <p className="text-xs uppercase font-semibold text-[rgb(var(--color-text))]/60 mb-1">
                                Nota
                              </p>
                              <textarea
                                value={noteDrafts[order.id] ?? order.fulfillmentNote ?? ''}
                                rows={3}
                                className="w-full rounded-xl border border-[rgb(var(--color-text))]/20 bg-white/80 px-3 py-2 text-sm text-[rgb(var(--color-text))] focus:border-cyan-400 focus:outline-none min-h-[120px]"
                                placeholder="Escribe comentarios sobre la entrega..."
                                onChange={(event) =>
                                  setNoteDrafts((prev) => ({
                                    ...prev,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                onBlur={(event) => {
                                  const candidate = event.target.value;
                                  if (candidate === (order.fulfillmentNote ?? '')) return;
                                  handleAddNote(order, candidate);
                                }}
                                disabled={noteUpdatingId === order.id}
                              />
                              {noteUpdatingId === order.id && (
                                <p className="mt-1 text-xs text-cyan-600">Guardando nota…</p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex">
                                <button
                                  onClick={() => handleReturnToggle(order)}
                                  disabled={returnUpdatingId === order.id}
                                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold cursor-pointer shadow ${
                                    order.fulfillmentReturn === 'devolucion'
                                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  } disabled:opacity-50`}
                                >
                                  {returnUpdatingId === order.id
                                    ? 'Actualizando...'
                                    : order.fulfillmentReturn === 'devolucion'
                                    ? 'Habilitar'
                                    : 'Devolución'}
                                </button>
                              </div>
                              <div className="flex">
                                <button
                                  onClick={() => handleResetOrder(order)}
                                  disabled={resetUpdatingId === order.id}
                                  className="w-full rounded-full px-4 py-2 text-sm font-semibold shadow bg-emerald-100 text-emerald-800 hover:bg-emerald-200 disabled:opacity-50 cursor-pointer"
                                >
                                  {resetUpdatingId === order.id ? 'Reactivando...' : 'Reactivar'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
