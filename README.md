# FitnessApp - Aplicação Completa

Este pacote contém todos os ficheiros necessários para instalar a aplicação FitnessApp no PythonAnywhere, organizados na estrutura correta para upload direto.

## Estrutura de Ficheiros

```
fitness-app/
├── criar_base_dados.sql       # Script SQL para criar a base de dados
├── fitness_app/               # Backend (Flask)
│   ├── requirements.txt       # Dependências do Python
│   └── src/                   # Código-fonte do backend
│       ├── main.py            # Ponto de entrada da aplicação
│       ├── extensions.py      # Extensões Flask
│       ├── models/            # Modelos de dados
│       ├── routes/            # Rotas da API
│       ├── services/          # Serviços de negócio
│       └── static/            # Ficheiros estáticos
└── frontend/                  # Frontend (React)
    ├── package.json           # Dependências do Node.js
    ├── index.html             # Página HTML principal
    ├── tsconfig.json          # Configuração TypeScript
    ├── vite.config.ts         # Configuração Vite
    └── src/                   # Código-fonte do frontend
```

## Instruções Rápidas

1. Faça upload deste ZIP para o PythonAnywhere
2. Descompacte usando: `unzip fitness-app.zip`
3. Configure a base de dados usando o script SQL
4. Configure o ambiente virtual e instale as dependências
5. Configure a aplicação web no PythonAnywhere

Para instruções detalhadas, consulte os guias de instalação fornecidos separadamente.
