# Café Dalí — Site de Encomendas

Site estático (HTML/CSS/JS) com carrinho de encomendas, painel de produtos com **edição ao vivo** e checkout via Mercado Pago (Checkout Pro). Publicado na Netlify a partir de um repositório no GitHub.

## Estrutura

```
index.html          → página inicial
encomendas.html      → catálogo de produtos (tortas, docinhos, folhados)
carrinho.html         → carrinho + formulário de pedido + pagamento
sucesso.html          → retorno de pagamento aprovado
pendente.html         → retorno de pagamento pendente (pix/boleto em análise)
erro.html             → retorno de pagamento não concluído
admin.html            → Painel de Produtos (uso interno, edição ao vivo)
css/style.css         → todo o estilo do site
js/catalogo-loader.js → busca o catálogo de produtos no servidor (ao vivo)
js/cart.js             → lógica do carrinho (compartilhada)
js/catalogo.js         → renderização da página de encomendas
js/checkout.js         → lógica do carrinho/checkout
js/admin.js            → lógica do Painel de Produtos
netlify/functions/get-products.js   → devolve o catálogo atual (lido do Netlify Blobs)
netlify/functions/save-products.js  → salva o catálogo editado (protegido por senha)
netlify/functions/default-catalogo.json → catálogo de exemplo (só usado antes do 1º salvamento)
netlify/functions/create-preference.js  → cria o pagamento no Mercado Pago
netlify.toml           → configuração da Netlify
package.json           → dependência usada pelas funções (Netlify Blobs)
img/                    → logo e fotos do café
```

## 1. Editar os produtos (ao vivo, sem baixar nem publicar nada)

Abra `admin.html` no site publicado (ex: `https://cafe-dali.netlify.app/admin.html`). É uma página de uso interno — não aparece nos menus para os clientes.

Nela você edita nome, descrição, preço e unidade de cada produto, adiciona ou remove produtos e até categorias inteiras, sem escrever código. Ao terminar:

1. Digite sua **senha do painel** no campo indicado.
2. Clique em **"Salvar alterações no site"**.

Pronto — a mudança já vale no site na mesma hora, para todo mundo, sem precisar baixar arquivo nem publicar de novo. A senha é definida por você numa variável de ambiente na Netlify (`ADMIN_PASSWORD`) — veja o passo 3 abaixo.

## 2. Configurar o pagamento (Mercado Pago)

O site já vem com o checkout pronto, mas para o pagamento online funcionar de verdade você precisa:

1. Criar/acessar sua conta em https://www.mercadopago.com.br
2. Ir em **Seu negócio > Configurações > Credenciais** e copiar o **Access Token de produção**
3. Na Netlify, abrir o projeto publicado → **Project configuration > Environment variables**
4. Criar a variável:
   - Nome: `MP_ACCESS_TOKEN`
   - Valor: (cole o access token — não precisa me mandar aqui no chat, por segurança)
5. Fazer um novo deploy (a Netlify pede isso após criar uma variável nova)

**Enquanto isso não estiver configurado**, o botão "Finalizar pedido" abre automaticamente o WhatsApp do Café Dalí com o resumo do pedido, então o site já funciona para receber encomendas mesmo antes de ligar o pagamento online.

## 3. Definir a senha do Painel de Produtos

Igual ao passo acima, só que com outra variável:

1. Na Netlify, no mesmo lugar (**Project configuration > Environment variables**), crie:
   - Nome: `ADMIN_PASSWORD`
   - Valor: uma senha só sua (guarde em lugar seguro — não precisa me enviar aqui no chat)
2. Faça um novo deploy depois de criar a variável.

Sem essa variável configurada, o botão "Salvar" do Painel de Produtos fica bloqueado por segurança.

## 4. Publicar o site (GitHub + Netlify)

O site foi migrado para publicação automática: em vez de arrastar a pasta pro Netlify toda vez, os arquivos ficam num repositório no GitHub e a Netlify publica sozinha sempre que algo muda lá. Isso é necessário para o Painel de Produtos (passo 1) funcionar de verdade.

**Se o site ainda não estiver conectado ao GitHub, siga isto uma única vez:**

1. **Criar conta no GitHub** (se você não tiver uma): acesse https://github.com e crie uma conta gratuita.
2. **Criar um repositório novo**: clique em "New repository", dê um nome (ex: `cafe-dali-site`) e crie (pode deixar como privado).
3. **Enviar os arquivos do site**: dentro do repositório recém-criado, clique em **"Add file" > "Upload files"** e arraste para a página **todo o conteúdo desta pasta** (os arquivos e pastas `index.html`, `css/`, `js/`, `img/`, `netlify/`, `netlify.toml`, `package.json`, etc. — não a pasta em si, o que está dentro dela). O GitHub aceita pastas inteiras arrastadas e mantém a estrutura de subpastas. Depois clique em **"Commit changes"** para confirmar o envio.
4. **Conectar o repositório à Netlify**: no painel da Netlify, abra o projeto "cafe-dali" já publicado → **Project configuration > Build & deploy > Continuous deployment** → clique em **"Link repository"** → escolha GitHub → autorize o acesso → selecione o repositório `cafe-dali-site`. Isso mantém o mesmo endereço do site (`cafe-dali.netlify.app`) — só passa a publicar a partir do GitHub.
5. Nas configurações de build pode aceitar os valores padrão (o `netlify.toml` já define tudo). Confirme e aguarde o primeiro deploy automático.
6. Configure as variáveis de ambiente `MP_ACCESS_TOKEN` (passo 2) e `ADMIN_PASSWORD` (passo 3), se ainda não tiver feito.

**Depois disso, no dia a dia:**

- Para mexer em **produtos** (preço, nome, adicionar/remover item): use o Painel de Produtos (`admin.html`) — não precisa mexer no GitHub.
- Para qualquer **outra mudança no site** (layout, textos, nova seção, correções): me peça aqui no chat, eu ajusto os arquivos, e você sobe a atualização arrastando os arquivos alterados de novo para "Add file > Upload files" no mesmo repositório do GitHub — a Netlify publica sozinha em seguida.

## 5. Número de WhatsApp

O número usado nos links de WhatsApp é `5548988410415` — (48) 98841-0415, já com o 9 — e está em `js/checkout.js` (constante `WHATSAPP_NUMBER`) e também espalhado nas páginas HTML (`wa.me/...`). Se o número mudar, é só pedir aqui no chat que eu atualizo em todos os lugares.

## 6. Regras de encomenda

- Antecedência mínima: 48 horas (configurável em `js/checkout.js`, constante `MIN_HOURS_AHEAD`)
- Quantidade mínima por pedido: a definir (ainda não implementado — avise quando decidir a regra)
- Entrega: endereço informado no formulário fica salvo no pedido; a taxa/área de entrega são combinadas depois com o cliente

## Próximos passos sugeridos

- Substituir os produtos de exemplo pela lista real (pelo próprio Painel de Produtos)
- Criar credenciais do Mercado Pago e configurar `MP_ACCESS_TOKEN`
- Definir a senha do painel (`ADMIN_PASSWORD`)
- Adicionar fotos reais dos produtos (hoje os cards mostram só o nome no lugar da foto)
