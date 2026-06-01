# Documentação da API - VitalWatch

Esta documentação descreve como interagir com as rotas do back-end (HTTP REST) e com os eventos do WebSocket para a aplicação VitalWatch.

A URL base assumida para os exemplos é `http://localhost:3001`.

---

## 1. Autenticação (`/auth`)

Todas as rotas referentes a cadastro de usuários e login da aplicação.

### 1.1 Registrar Enfermeira
- **Método**: `POST`
- **Rota**: `/auth/enfermeiraRegistro`
- **Descrição**: Cria uma nova conta para uma enfermeira. Esta é uma rota aberta (não exige token).
- **Body (JSON)**:
  ```json
  {
    "email": "enfermeira@vitalwatch.com",
    "senha": "senha_segura"
  }
  ```

### 1.2 Login
- **Método**: `POST`
- **Rota**: `/auth/login`
- **Descrição**: Rota unificada para login de pacientes e enfermeiras.
- **Body (JSON)**:
  ```json
  {
    "email": "usuario@vitalwatch.com",
    "senha": "senha_segura"
  }
  ```
- **Retorno**: Retorna um token JWT que deve ser enviado no header `Authorization` nas rotas protegidas (como `Bearer <TOKEN>`).

### 1.3 Registrar Paciente
- **Método**: `POST`
- **Rota**: `/auth/pacienteRegistro`
- **Descrição**: Cadastra um novo paciente e o vincula à enfermeira que está realizando a requisição.
- **Autenticação**: Requer Token JWT (apenas enfermeiras podem acessar).
- **Header**: `Authorization: Bearer <TOKEN>`
- **Body (JSON)**:
  ```json
  {
    "email": "paciente@vitalwatch.com",
    "senha": "senha_paciente",
    "nome": "João da Silva",
    "idade": 45,
    "altura": 1.75,
    "peso": 80.5,
    "id_micro": "micro_abc123"
  }
  ```
  *(Nota: `idade`, `altura`, `peso` e `id_micro` são opcionais)*

---

## 2. Medidas (`/medidas`)

Rotas responsáveis por gerenciar os dados vitais (batimentos cardíacos e oxigenação).

### 2.1 Enviar Medidas (IoT/Microcontrolador)
- **Método**: `POST`
- **Rota**: `/medidas/enviarMedidas`
- **Descrição**: Rota usada pelo microcontrolador (ESP32, etc) para enviar dados vitais do paciente.
- **Body (JSON)**:
  ```json
  {
    "id_micro": "micro_abc123",
    "heat_rate": 85,
    "spo2": 98,
    "timestamp": "2026-05-27T10:00:00Z" // (Opcional)
  }
  ```

### 2.2 Dashboard (Estatísticas do Paciente)
- **Método**: `GET`
- **Rota**: `/medidas/dashboard`
- **Descrição**: Retorna os dados do dashboard para o paciente autenticado.
- **Autenticação**: Requer Token JWT.
- **Query Params**:
  - `?periodo=hoje`: Retorna todas as medidas do dia atual (detalhado).
  - `(sem query)`: Retorna os dados agregados diários dos últimos 30 dias.

### 2.3 Médias Diárias
- **Método**: `GET`
- **Rota**: `/medidas/estatisticasDiarias/batimentos` OU `/medidas/estatisticasDiarias/oxigenacao`
- **Descrição**: Retorna a média de um dia específico para o paciente logado.
- **Autenticação**: Requer Token JWT.
- **Query Params**:
  - `?date=2026-05-27`: Data desejada. Se omitido, usa o dia atual.

---

## 3. Informações do Paciente (`/infoPaciente`)

Rotas para obter os dados demográficos (estáticos) do paciente.

### 3.1 Informações do Card
- **Método**: `GET`
- **Rota**: `/infoPaciente/card/:id`
- **Descrição**: Busca o nome e a idade do paciente a partir do seu ID. Muito útil para popular a interface do dashboard sem sobrecarregar o WebSocket.
- **Autenticação**: Requer Token JWT.
- **Parâmetro de URL**: `id` -> O UUID do paciente (`paciente_id`).

---

## 4. WebSocket (Comunicação em Tempo Real)

A conexão WebSocket é feita usando a biblioteca `socket.io-client` no front-end. O servidor exige autenticação no momento da conexão (handshake).

### 4.1 Conectando ao Socket
A enfermeira deve passar o Token JWT para se conectar e entrar na sua sala dedicada (`enfermeira_<ID>`).

**Exemplo de Conexão no Front-end (React/JS)**:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: "SEU_TOKEN_JWT_AQUI"
  }
});
```

### 4.2 Escutando Eventos de Sinais Vitais
Sempre que o microcontrolador enviar dados reais por `POST /medidas/enviarMedidas`, o servidor emitirá um evento `novaMedida` via WebSocket para a sala da enfermeira.

**Ouvindo o Evento**:
```javascript
socket.on('novaMedida', (dados) => {
  console.log("Recebidos novos sinais vitais: ", dados);
});
```

**Payload recebido no evento `novaMedida`**:
```json
{
  "paciente_id": "uuid-do-paciente",
  "batimentos": 85,
  "oxigenacao": 98,
  "time": "2026-05-27T10:00:00Z"
}
```
*(Nota: Para obter o nome e a idade, o front-end deve usar os dados estáticos utilizando a rota `GET /infoPaciente/card/:id` a partir do `paciente_id` recebido aqui)*
