## Ferramentas para Backup

### Google Cloud Scheduler

Feramentas do Google que permite agendar tarefas em intervalos definidos (semelhante com um cron job).

#### 1. Criar um job no Cloud Scheduler

- Definir a frequência de execução (ex: todo mês no dia 1 às 2h da manhã)

- O formato da frequência segue a sintaxe cron.

#### 2. Esse job dispara um requisição HTTP ou Pub/Sub

- Normalmente é criado uma **Cloud Function** ou **Cloud Run** que executa o comando da exportação do Firestore.

#### 3. A função executa o comando de backup

- Dentro da função, é executado algo como:

```bash
gcloud firestore export gs://NOME_DO_BUCKET/backup-$(date + %F)
```

#### 4. Resultado

- O Scheduler -> dispara a função -> que salva o backup no Storage

### GitHub Actions

Um backup via **GitHub Actions** funciona de forma semelhante com o **Scheduler**, mas quem agenda/roda é o próprio GitHub.

#### 1. Como funciona

- Você cria um arquivo `.github/workflows/firestore-backup.yml`.

- Nele define o gatilho, por exemplo:

  - on: schedule -> agenda (ex: todo dia às 03h UTC).

- Dentro do workflow é executado as algumas ações previamente necessárias como autentição/credenciamento e instalação da SDK do Google Cloud

- No final rodando o comando de backup:

```bash
gcloud firestore export gs://NOME_DO_BUCKET/backup-$(date + %F)
```

#### 2. Resultado

- O GitHub executa o backup no horário configurado.

- Os dados vão para o bucket do Google Cloud Storage.

### Local de armazenamento (Buckets)

Um **bucket** no **Google Cloud Storage (GCS)** é como uma “pasta” onde você armazena arquivos (objetos). Para **backups do Firestore**, o bucket é o destino onde o comando `gcloud firestore export` grava os dados.

#### Pontos principais:

- **Região:** O bucket precisa ser criado na mesma **região** do seu Firestore (ex: Firestore em **southamerica-east1**) -> bucket também deve está em **southamerica-east1**

- **Pemissões:** A **service account** usada para backup precisa de acesso de escritura/leitura no bucket **(roles/storage.admin)**

- **Estrutura de armazenamento:** os backup podem ser organizados em pastas com o nome do backup (ex: /firestore/... /auth/...)

- **Custo**: Você paga pelo **armazenamento dos backups**

### Retenção do Backup (Ciclo de vida do backup)

A retenção do armazenamento é configurado dentro do bucket de armazenamento, onde é criado regras automáticas **via terminal ou editor do Cloud Shell**

```js
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }
  ]
}
```

#### Vida útil do backup

- Tecnicamente, o backup fica salvo **enquanto o objeto existir no backup**

- Se não for configurado **política de rentenção**, ele fica **para sempre** (até você deletar
- manualmente) ]

- A retenção de armazenamento é útil para ter um gerenciamento de arquivos mais recentes, e sempre manter o espaço de armazenamento otimizado. (Quanto mais espaço ocupar os backups, maior será a cobrança feita mensalmente pelo Google)

#### Pontos importantes

- A configuração de rentenção é global para o bucket de armazenamento

- Se você definir que o bucket tem **retenção de 30 dias**, **todos os objetos** gravados nesse bucket só poderão ser excluídos após 30 dias.

- Não dá para aplicar retenções diferentes (30 dias para Firestore, 90 para Auth) **dentro do mesmo bucket**

- Caso seja necessário períodos de retenção diferentes para cada backup, deverá ser configurado em bucket diferentes.

#### Estimativa de custos

##### [Cloud Storage Princing](https://cloud.google.com/storage?utm_source=google&utm_medium=cpc&utm_campaign=latam-BR-all-pt-dr-BKWS-all-all-trial-p-dr-1710136-LUAC0015581&utm_content=text-ad-none-any-DEV_c-CRE_529549610537-ADGP_Hybrid+%7C+BKWS+-+PHR+%7C+Txt_Storage-Cloud+Storage-KWID_296145900959-kwd-296145900959&utm_term=KW_google+cloud+storage-ST_google+cloud+storage&gclsrc=aw.ds&gad_source=1&gad_campaignid=13622552775&gclid=Cj0KCQjw58PGBhCkARIsADbDilz2X4CcyC_YZawRcPo0ZyAXt63ky-s6HlQ1ltVSVyvikB4x954BR30aAgE9EALw_wcB&hl=pt_br)

#### Restauração de dados

- Poder ser executado via **Cloud Shell** com o comando:

```bash
gcloud firestore import gs://gcvendas-backup/firestore-2025-09-22
```

Isso recria os dados no Firestore a partir desses arquivos.
