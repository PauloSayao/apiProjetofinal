const PORT = process.env.PORT || 3001;
const express = require("express");
const path = require("path");
const cors = require("cors");

// Configuração segura para produção e desenvolvimento
const allowedOrigins = [
  'https://projeto-final-lemm.vercel.app',
  'http://localhost:4200'
];

const app = express();

// Configuração avançada do CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.error(`Bloqueado pelo CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares na ordem correta
app.use(cors(corsOptions)); // CORS primeiro
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    cors: 'enabled',
    allowedOrigins,
    timestamp: new Date() 
  });
});

// Dados em memória (substitua por banco de dados em produção)
const users = [
  { name: "admin", password: "123456", role: "admin", email: "admin@email.com", telephone: "123456789" },
  { name: "user", password: "123456", role: "user", email: "user@email.com", telephone: "987654321" },
];

const produtos = [
  { id: 1, name: 'Trufa de Chocolate', price: 5.0, image: 'trufachocolate.jpg', descricao: 'Deliciosa trufa recheada com ganache de chocolate meio amargo.', quantity: 1, ativo: true },
  { id: 2, name: 'Trufa de Maracujá', price: 5.5, image: 'trufamaracuja.jpg', descricao: 'Trufa cremosa com recheio de maracujá e cobertura branca.', quantity: 1, ativo: true },
  { id: 3, name: 'Trufa de Coco', price: 5.0, image: 'trufacoco.jpg', descricao: 'Recheio de coco com cobertura de chocolate ao leite.', quantity: 1, ativo: true },
  { id: 4, name: 'Trufa de Limão', price: 5.50, image: 'trufalimão.jpg', descricao: 'Trufa refrescante com recheio de limão siciliano.', quantity: 1, ativo: false },
  { id: 5, name: 'Trufa de Morango', price: 5.50, image: 'trufamorango.jpg', descricao: 'Trufa com recheio de morango e cobertura de chocolate ao leite.', quantity: 1, ativo: false }
];

const pedidosSalvos = [];
let pedidoIdCounter = 1;

// Rotas de autenticação
app.post("/login", (req, res) => {
  const { name, password } = req.body;
  const user = users.find(u => u.name === name && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Usuário ou senha incorretos!" });
  }

  return res.status(200).json({
    id: users.indexOf(user) + 1,
    name: user.name,
    email: user.email,
    role: user.role,
    telephone: user.telephone
  });
});

app.post("/register", (req, res) => {
  const { name, password, email, fullName, telephone } = req.body;

  if (!name || !password || !email) {
    return res.status(400).json({ message: "Preencha todos os campos obrigatórios!" });
  }

  const userExists = users.find(u => u.name === name || u.email === email);
  if (userExists) {
    return res.status(409).json({ message: "Usuário ou e-mail já cadastrado!" });
  }

  users.push({ name, password, email, fullName, telephone, role: "user" });
  return res.status(201).json({ message: "Usuário registrado com sucesso!" });
});

// Rotas de produtos
app.get("/produtos", (req, res) => res.status(200).json(produtos));

app.patch("/produtos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const produto = produtos.find(p => p.id === id);
  
  if (!produto) return res.status(404).json({ message: "Produto não encontrado!" });
  
  produto.ativo = !produto.ativo;
  return res.status(200).json({ message: "Produto atualizado com sucesso!", produto });
});

// Rotas de pedidos
app.post("/pedidos", (req, res) => {
  const { produtos, nome, telefone } = req.body;

  if (!produtos || !Array.isArray(produtos) || !nome || !telefone) {
    return res.status(400).json({ message: "Pedido inválido!" });
  }

  pedidosSalvos.push({ id: pedidoIdCounter++, produtos, nome, telefone });
  return res.status(201).json({ message: "Pedido salvo com sucesso!" });
});

app.get("/pedidos", (req, res) => res.status(200).json({ pedidos: pedidosSalvos }));

app.delete("/pedidos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = pedidosSalvos.findIndex(p => p.id === id);

  if (index === -1) return res.status(404).json({ message: "Pedido não encontrado!" });
  
  pedidosSalvos.splice(index, 1);
  return res.status(200).json({ message: "Pedido removido com sucesso!" });
});

app.delete("/pedidos", (req, res) => {
  pedidosSalvos.length = 0;
  return res.status(200).json({ message: "Todos os pedidos foram removidos!" });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Acesso bloqueado pela política de CORS' });
  }
  
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
  console.log(`Origens permitidas: ${allowedOrigins.join(', ')}`);
});