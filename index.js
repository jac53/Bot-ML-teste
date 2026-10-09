const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota que o Mercado Livre vai chamar quando houver uma mensagem
app.post('/webhook', (req, res) => {
    const notificacao = req.body;
    console.log("Notificação recebida:", notificacao);

    // Responde com 200 OK rapidamente para o ML não achar que o bot caiu
    res.status(200).send("Recebido");

    // Lógica simples: se for uma notificação de mensagem nova, tentamos agir
    if (notificacao.topic === "messages") {
        console.log("Uma nova mensagem chegou no chat!");
        // AQUI ENTRARIA O CÓDIGO PARA ENVIAR O LINK DO DROPBOX
        // Exige o token de acesso (OAuth) que configuraremos depois.
    }
});

// Inicia o servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Bot online e escutando na porta ${port}`);
});
