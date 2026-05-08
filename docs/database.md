# Estrutura de Dados

O OpsValidation usa uma arquitetura semi estática:

- Configurações de frentes, taxonomia e régua vivem em JSONs versionados em `data/`.
- Registros de validação feitos pelas pessoas usuárias vivem no MongoDB Atlas.
- O frontend nunca acessa o MongoDB diretamente. Ele chama Vercel Functions em `/api`.

## Variáveis de Ambiente

Configure estas variáveis na Vercel:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=ops_validation
MONGODB_RECORDS_COLLECTION=validation_records
```

## Collection: validation_records

Cada documento representa uma validação finalizada.

```ts
{
  _id: ObjectId,
  disciplineId: "content" | "system" | "accessibility",
  designer: string,
  journey: string,
  journeyLink: string,
  round: number,
  date: "YYYY-MM-DD",
  checkedCriteria: string[],
  maturityPoints: number,
  maturityLevel: "alta" | "media" | "baixa",
  errors: [
    {
      categoryId: string,
      categoryLabel: string,
      errorId: string,
      name: string,
      severity: "critico" | "alto" | "medio" | "baixo",
      avoidable: boolean,
      note: string
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Endpoints

`GET /api/records`

Retorna até 500 validações, ordenadas da mais recente para a mais antiga.

`POST /api/records`

Cria uma validação. O payload segue o mesmo formato de `ValidationRecord`, sem `id`.

## Segurança

As credenciais do MongoDB ficam apenas nas variáveis de ambiente da Vercel. A próxima camada recomendada é autenticação antes de liberar leitura e escrita dos endpoints.
