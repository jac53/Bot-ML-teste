const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// COLE O SEU ACCESS TOKEN DO MERCADO LIVRE AQUI ENTRE AS ASPAS:
const ACCESS_TOKEN = 'C4XklFMaMZlj6Q1uLVLQ1eYFrx29miby';

// DICIONÁRIO DE ANÚNCIOS: Relacione o ID do anúncio com o link do Dropbox
const LINKS_PRODUTOS = {
    '5348812545': 'https://www.dropbox.com/scl/fo/zfxmm4qtqi0iwxqr6r4x6/AF_pKfVP3tIzoQNyqSNVfB4?rlkey=126col2qyvsyc2x9we8xexvxr&st=uy2no8qt&dl=0',
    // Se tiver mais anúncios, basta adicionar assim:
    // 'MLB_OUTRO_ID_AQUI': 'https://www.dropbox.com/s/outro-link?dl=0'
};

app.post('/webhook', async (req, res) => {
    try {
        const notification = req.body;
        console.log('Notificação recebida do ML:', JSON.stringify(notification));

        // Verifica se é uma notificação de mensagem pós-venda
        if (notification.topic === 'messages' || (notification.resource && notification.resource.includes('/messages'))) {
            const resourceParts = notification.resource.split('/');
            const messageId = resourceParts[resourceParts.length - 1];

            // 1. Buscar detalhes da mensagem para descobrir o pack_id e o remetente
            const msgResponse = await axios.get(`https://api.mercadolibre.com/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
            });

            const msgData = msgResponse.data;
            const fromRole = msgData.from.user_type || msgData.from.role;

            // IMPORTANTE: Só respondemos se a mensagem veio do comprador
            if (fromRole === 'buyer') {
                const packId = msgData.pack_id || msgData.client_id;
                const buyerId = msgData.from.id;

                // 2. Buscar os detalhes da venda para descobrir qual foi o anúncio (item_id) comprado
                let itemId = null;
                
                if (packId) {
                    const orderResponse = await axios.get(`https://api.mercadolibre.com/orders/search?pack_id=${packId}`, {
                        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
                    });
                    
                    if (orderResponse.data.results && orderResponse.data.results.length > 0) {
                        itemId = orderResponse.data.results[0].order_items[0].item.id;
                    }
                }

                console.log(`Mensagem recebida do comprador ${buyerId} referente ao anúncio: ${itemId}`);

                // 3. Verificar se temos um link cadastrado para este anúncio
                if (itemId && LINKS_PRODUTOS[itemId]) {
                    const linkDropbox = LINKS_PRODUTOS[itemId];
                    const respostaTexto = `Olá! Muito obrigado pela sua compra! \n\nConforme prometido, segue abaixo o link para download dos arquivos no Dropbox, juntamente com o vídeo de passo a passo:\n\n${linkDropbox}\n\nQualquer dúvida, estamos à disposição!`;

                    // 4. Enviar a resposta automaticamente no chat da venda
                    await axios.post(`https://api.mercadolibre.com/messages/packs/${packId}/sellers/${msgData.seller_id}`, {
                        text: respostaTexto
                    }, {
                        headers: { 
                            Authorization: `Bearer ${ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    console.log('Link e instruções enviados com sucesso para o comprador!');
                } else {
                    console.log('Anúncio sem link automático configurado ou ID não encontrado.');
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro ao processar webhook:', error.response?.data || error.message);
        res.status(500).send('Erro interno');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot online e escutando na porta ${PORT}`);
});
