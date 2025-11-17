export default async function handler(req, res) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    if (req.method === 'POST') {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: req.body.lineItems.map((item) => ({
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: item.descripcion,
                        },
                        unit_amount: item.precio,
                    },
                    quantity: item.quantity,
                })),
                mode: 'payment',
                success_url: `${req.headers.origin}/section/shopping?lang=es&success=true`,  // No necesitas session_id para este flujo
                cancel_url: `${req.headers.origin}/section/shopping?lang=es&canceled=true`,
            });

            // Devolver el sessionId para redirigir al checkout
            res.status(200).json({ sessionId: session.id });
        } catch (err) {
            console.error('Error creando la sesión de Stripe:', err);
            res.status(500).json({ statusCode: 500, message: err.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
