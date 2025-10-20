import MetaHead from '@/app/components/meta-head';
import FormInvoice from '@/app/components/principal/invoices/form-invoice';

export default function Invoices() {
    return (
        <section>
            <MetaHead title="Invoices"/>
            <FormInvoice />
        </section>

    )
}