# giz ✏️

**Transforme uma ideia em vídeo animado: uma história ou uma aula.** O **giz Estúdio** é um aplicativo de
computador que leva você da ideia ao vídeo pronto, com personagens 2D que falam, gesticulam e reagem, legendas,
cenários e efeitos sonoros. **[Conheça e baixe no site](https://andersonguilherme.github.io/giz/)**.

- **História ou aula**, em **9:16** (vertical, para Reels, Shorts e TikTok) ou **16:9** (horizontal, para o YouTube);
  o mesmo projeto renderiza nas duas proporções.
- **Qualquer elenco:** escolha personagens prontos ou monte os seus (corpo, cores, expressão e voz de cada um).
  Lia e Téo, a dupla das aulas de exemplo, são só um elenco entre outros.
- **Cenários do seu jeito:** fundos vetoriais prontos, uma imagem sua (enviada e recortada no enquadramento) ou uma
  imagem gerada por IA.
- **Vozes locais ou pagas:** a voz local roda no seu computador, de graça (CPU ou GPU NVIDIA); se preferir, use um
  serviço pago (ElevenLabs, Fish Audio) ou grave a sua própria voz no microfone.
- **A animação segue o áudio:** o giz mede cada fala e anima a boca, os gestos e as cenas no tempo certo. Nada é
  cronometrado à mão.

O roteiro você escreve no Estúdio, à mão ou a partir de um rascunho de uma IA de textos. Para quem prefere o
terminal, o mesmo motor também roda pela linha de comando (`npx giz`).

> Exemplo completo no repositório: o curso **SOLID** (24 aulas) em [`courses/solid`](courses/solid), e os projetos de
> exemplo de [`core/examples`](core/examples).

## Preciso pagar alguma IA?

**Não: tudo grátis e local é possível.** Sem conta, sem chave de API e sem internet depois de instalar. As IAs pagas
são opcionais: cada uma só é usada se você guardar a chave dela em **Configurações › Contas de IA** e escolher usá-la.

| Parte | Grátis e local | Opcional, pago (com a sua chave) | Quanto custa o pago (estimativa) |
|---|---|---|---|
| **Roteiro** | você escreve no editor do Estúdio | rascunho por IA de textos: Claude (Anthropic), GPT (OpenAI) ou Gemini (Google) | de menos de um centavo a algumas dezenas de centavos de dólar por roteiro, conforme o modelo |
| **Cenários** | fundos vetoriais prontos, ou a sua imagem (enviar e recortar) | imagem gerada: gpt-image (OpenAI), Gemini ou FLUX (fal) | de ~US$ 0,03 a ~US$ 0,17 por imagem, conforme o modelo e o tamanho |
| **Vozes** | [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) 0.6B ou 1.7B (modelo aberto da Alibaba, Apache-2.0) na CPU ou na GPU NVIDIA, ou a sua gravação | ElevenLabs ou Fish Audio | ElevenLabs: US$ 0,04 a 0,08 por mil caracteres; Fish Audio: US$ 0,015 a 0,05 por mil bytes de texto |
| **Animação e vídeo** | [Remotion](https://remotion.dev): desenha cada quadro com código React (não é IA) | — | grátis para pessoa física e empresa de até 3 pessoas; acima disso, licença paga do Remotion |
| **Boca dos personagens** | espeak-ng: o texto vira fonemas, e cada fonema vira uma forma de boca | — | grátis |
| **Alinhar as falas e conferir a pronúncia** (opcional) | Whisper small (modelo aberto da OpenAI, MIT), local | — | grátis |

- **Você vê o custo antes e confirma.** Antes de cada chamada paga (gerar um roteiro, um cenário, as vozes ou uma
  amostra de voz paga), o Estúdio mostra a estimativa e pede confirmação. Os preços das tabelas foram conferidos em
  27/11/2026 nas páginas de cada serviço e podem mudar; a cobrança é sempre a do serviço, na sua conta.
- **A animação não é gerada por IA.** Os personagens, as poses, as expressões e as cenas (código, terminal, gráficos,
  cartões, cenários) são componentes programados no motor ([`core/src/presentation/remotion`](core/src/presentation/remotion)).
  O roteiro diz *o que* acontece; o motor desenha sempre do mesmo jeito. Por isso o visual é consistente e não
  "alucina".
- **Voz e vídeo são etapas separadas.** A voz (local, paga ou gravada) vira um arquivo de áudio por fala; depois o
  Remotion monta o vídeo no ritmo desses áudios. O Remotion não gera voz.
- **Os modelos de IA locais são baixados uma vez**, no assistente da primeira execução ou em **Configurações**
  (5,9 GB ou 13,4 GB para a voz, conforme o modelo; ~250 MB para o Whisper). O Estúdio nunca baixa um modelo
  sozinho no meio do trabalho: se faltar o modelo de voz, ele avisa e leva você a Configurações. Depois disso, tudo
  funciona sem internet.

## Instalar

O **giz Estúdio** é o aplicativo de computador do giz: você instala, abre e faz tudo pela janela (configuração,
contas de IA, roteiro, elenco, cenários, vozes, prévia e vídeo final), sem repositório, sem Node e sem terminal.
O resto deste README (a partir de *Requisitos*) é para quem prefere usar o giz pela linha de comando.

### Baixar

No site do giz, **[andersonguilherme.github.io/giz](https://andersonguilherme.github.io/giz/#download)**, o botão já
escolhe o instalador do seu sistema. Ou, na página de **Releases** do repositório, baixe o arquivo do seu sistema:

| Sistema | Arquivo | Como instalar |
|---|---|---|
| **Windows** 10/11 (64 bits) | `giz-estudio-<versão>-Setup.exe` | dê dois cliques; o app abre sozinho no fim e ganha atalho no menu Iniciar |
| **macOS** (Apple Silicon) | `giz-estudio-<versão>-arm64.dmg` | abra o `.dmg` e arraste o **giz Estúdio** para **Aplicativos** |
| **Linux** Ubuntu/Debian | `giz-estudio_<versão>_amd64.deb` | use o `.deb`: `sudo apt install ./giz-estudio_<versão>_amd64.deb` |
| **Linux** Fedora/openSUSE | `giz-estudio-<versão>-1.x86_64.rpm` | `sudo dnf install ./giz-estudio-<versão>-1.x86_64.rpm` |
| **Linux** outras distribuições | `giz-estudio-<versão>-x64.AppImage` | `chmod +x` no arquivo e abra com dois cliques (veja a nota abaixo) |

Também há um `.zip` de cada sistema (`giz-estudio-<sistema>-<arquitetura>-<versão>.zip`), que roda sem instalar:
descompacte numa pasta sua e abra o programa `giz-estudio`.

### "Aplicativo não verificado": é esperado

Os instaladores **não são assinados** (assinatura de código custa uma conta paga da Apple e um certificado para o
Windows). Por isso o sistema avisa na primeira vez:

- **Windows (SmartScreen):** na tela azul "O Windows protegeu o computador", clique em **Mais informações** e depois
  em **Executar assim mesmo**.
- **macOS (Gatekeeper):** na primeira vez, o macOS recusa abrir o app. Depois desse aviso:
  - **macOS 15 (Sequoia) ou mais novo:** abra **Ajustes do Sistema → Privacidade e Segurança**, role até o aviso
    sobre o **giz Estúdio** e clique em **Abrir Mesmo Assim**; confirme com a sua senha. Nas próximas vezes ele abre
    normalmente.
  - **macOS 14 ou mais antigo:** em **Aplicativos**, clique com o botão direito (ou Control+clique) no
    **giz Estúdio**, escolha **Abrir** e confirme **Abrir** no aviso.
  - Se o macOS disser que o app "está danificado", ou se o render for bloqueado, rode uma vez no Terminal:
    `xattr -dr com.apple.quarantine "/Applications/giz Estúdio.app"`.
- **Linux:** não há aviso.
  - **Ubuntu e Debian: use o `.deb`.** Ele instala o app com tudo o que o Chromium precisa, inclusive no Ubuntu 24.04
    ou mais novo.
  - **Sobre o AppImage:** ele precisa de FUSE (`sudo apt install libfuse2`, ou abra com
    `./giz-estudio-*.AppImage --appimage-extract-and-run`). No Ubuntu 24.04 ou mais novo, o AppArmor bloqueia os
    *user namespaces* que a proteção (sandbox) do Chromium usa, e o AppImage fecha logo ao abrir: nesses sistemas, use
    o `.deb`.

### Primeira vez que abre

Um assistente prepara o Estúdio em poucos passos:

1. **Idioma** (português ou inglês) e **pasta dos projetos** (sugestão: `~/giz/projetos`).
2. **Placa de vídeo (opcional):** com uma NVIDIA no Linux, o botão **Instalar** baixa o suporte à GPU
   (~245 MB do ONNX Runtime CUDA, conferido com o hash publicado, e ~1,8 GB de bibliotecas da NVIDIA) e a voz fica
   bem mais rápida. Funciona em todos os formatos (`.deb`, `.rpm`, AppImage e `.zip`): o suporte fica nos dados do app.
   Sem GPU, tudo funciona na CPU.
3. **Modelos de voz:** baixe o Qwen3-TTS 0.6B (5,9 GB) ou 1.7B (13,4 GB) e, se quiser alinhar as falas com
   precisão, o Whisper (~250 MB). Os downloads podem ser pausados e continuam de onde pararam.
4. **Contas de IA (opcional):** cole as chaves dos serviços que quiser usar (texto, imagem, voz) e teste cada uma.
5. **Licença do Remotion:** grátis para pessoa física e empresas de até 3 pessoas.

Depois disso o Estúdio funciona **sem internet** (o render de vídeo também), exceto as chamadas às IAs pagas que você
escolher.

### Onde ficam as coisas

| O quê | Onde |
|---|---|
| Projetos | a pasta escolhida no assistente (sugestão: `~/giz/projetos`) |
| Modelos de voz e GPU | `~/.cache/giz` (dá para mudar em Configurações) |
| Configuração compartilhada com a linha de comando | `~/.config/giz/giz.config.json` (a linha de comando também a usa quando o repositório não tem o seu `giz.config.json`) |
| Chaves de API | no chaveiro do sistema (cifradas, no arquivo `keys.json` dos dados do app); sem chaveiro, em `~/.config/giz/<serviço>.key` (só você lê) |
| Dados do app (preferências, Whisper, suporte à GPU, retratos) | Linux: `~/.config/giz-estudio` · Windows: `%APPDATA%\giz-estudio` · macOS: `~/Library/Application Support/giz-estudio` |

### Desinstalar

- **Windows:** Configurações → Aplicativos → **giz Estúdio** → Desinstalar.
- **macOS:** arraste o **giz Estúdio** de **Aplicativos** para o Lixo.
- **Linux:** `sudo apt remove giz-estudio` (deb), `sudo dnf remove giz-estudio` (rpm) ou apague o AppImage.

Desinstalar não apaga seus projetos nem os modelos. Para liberar o espaço, apague também `~/.cache/giz`,
`~/.config/giz` e a pasta de dados do app (tabela acima).

## Usando o Estúdio

Depois do assistente da primeira execução, o Estúdio abre na lista de projetos. Cada projeto passa por etapas, na
barra do alto: **Roteiro → Elenco → Cenários → Vozes → Vídeo**. Cada mudança é verificada e salva sozinha.

1. **Novo projeto.** Escolha o formato (**história** ou **aula**), a proporção (**9:16** ou **16:9**), o idioma, a
   duração, o tema, o público e o tom, e escolha personagens e cenários prontos (ou deixe a escolha para a IA). Depois:
   - **Gerar com IA:** a IA de textos escolhida em Configurações escreve um rascunho do roteiro; você vê o custo
     antes de confirmar.
   - **Escrever eu mesmo:** o projeto nasce com o elenco escolhido, um narrador e uma primeira fala para completar.
2. **Roteiro.** Cada fala tem quem fala, o texto da legenda, a pose, a expressão e a cena. As falas ficam
   **recolhidas** num resumo de uma linha e abrem com um clique (**Expandir todas** / **Recolher todas**); os
   capítulos organizam o vídeo. A verificação aponta na hora o que não cabe na tela ou falta. Na primeira vez, um
   **tutorial** guiado mostra o editor (dá para vê-lo de novo em Configurações).
3. **Elenco.** Adicione personagens prontos ou novos e ajuste corpo, cores, expressão e a voz de cada um, com a
   prévia animada ao lado. **Ouvir amostra** diz uma frase com a voz do projeto (com uma voz paga, o Estúdio
   pergunta antes, porque cada amostra nova é cobrada).
4. **Cenários.** Um cartão por cenário: use um **fundo vetorial**, **envie uma imagem** sua e **recorte o
   enquadramento**, ou **gere com IA** (com a estimativa antes de confirmar).
5. **Vozes.** Cada fala com a sua voz: a **local** (Qwen3-TTS, na GPU ou na CPU, grátis), uma **paga** (ElevenLabs
   ou Fish Audio; **Gerar todas as pendentes** mostra o custo e pede confirmação) ou **gravar minha voz** no
   microfone. Ouça, gere de novo só uma fala ou volte à voz do projeto. Só as falas que mudaram são refeitas.
6. **Vídeo.** A **prévia** do vídeo inteiro, montada com as vozes e os cenários de agora; a **verificação** na
   proporção escolhida; o **render** em **9:16** ou **16:9** (cada proporção tem o seu arquivo); e a **legenda SRT**
   para copiar ou exportar. O vídeo fica na pasta `output/` do projeto.

---

**Daqui em diante, tudo é só para a linha de comando.** Quem usa o Estúdio não precisa de nada destas seções.

## Requisitos (linha de comando)

- **Node.js 22.18 ou mais novo** (roda TypeScript direto, sem build)
- **Disco:** ≈2 GB de dependências + 5,9 GB (modelo 0.6b) ou 13,4 GB (modelo 1.7b); +1,8 GB com GPU
- **Memória:** modelo 0.6b: 8 GB de RAM; modelo 1.7b: GPU com 16 GB de memória de vídeo, ou ~20 GB de RAM na CPU
- Linux, macOS ou Windows com WSL
- GPU é **opcional**: com uma NVIDIA (Linux ou WSL) a voz fica bem mais rápida. O `npm run setup` configura.

Tempo de máquina para cada 1 s de fala: modelo 0.6b ≈ 4 s na CPU (6 núcleos) e ≈ 2 s na GPU (RTX 5060 Ti); modelo 1.7b ≈ 3 s na GPU. Uma aula de 6 min leva de 12 a 25 min de voz,
só na primeira vez; falas que não mudaram não são regravadas). O vídeo leva ~2 min.

## Passo a passo: criando seu curso (linha de comando)

### 1. Instale e configure

```bash
git clone https://github.com/AndersonGuilherme/giz.git
cd giz/motor
ONNXRUNTIME_NODE_INSTALL=skip npm install
npm run setup
```

O `npm run setup` é um **onboarding guiado no terminal**. Ele pergunta e prepara tudo para a SUA máquina:

1. confere a versão do Node;
2. pergunta onde guardar os modelos de IA (e mostra o espaço livre);
3. detecta sua placa de vídeo. Com **GPU NVIDIA**, oferece usá-la e baixa sozinho as bibliotecas CUDA
   (sem sudo e sem instalar o CUDA Toolkit; basta o driver da NVIDIA). Sem GPU, pergunta quantos núcleos da CPU usar;
4. pergunta o tamanho do modelo de voz (**0.6b**, leve, ou **1.7b**, mais natural e com instruções de estilo; ele
   recomenda conforme a sua memória), o nome do seu canal (aparece no canto dos vídeos), o idioma, as vozes de
   Lia e Téo e, no 1.7b, o **estilo** de cada um ("fale com energia e curiosidade, como um jovem desenvolvedor");
5. pergunta se você quer o controle de qualidade da pronúncia (Whisper);
6. pergunta quem vai usar (pessoa física ou empresa), por causa da licença do Remotion;
7. baixa o modelo de voz, gera uma fala de teste, mede a velocidade e, se você quiser, gera amostras de todas
   as vozes em `amostras-de-voz/` para você ouvir.

As respostas ficam em `giz.config.json`, na raiz. Esse arquivo é **individual**: não vai para o git, então cada
instalação tem a sua configuração. Para mudar algo, rode `npm run setup` de novo
(ou `npm run setup -- --padrao` para aceitar todas as respostas padrão sem perguntar).

### 2. Crie o curso

```bash
npm run novo-curso -- logica "Lógica de programação do zero"
```

Isso cria `courses/logica/` com `curso.yaml`, `plano-do-curso.md` e `pronuncia.json`. Preencha o
`plano-do-curso.md`: resultado final, público, **projeto-fio** (um exemplo que atravessa o curso inteiro) e a
lista de aulas.

### 3. Crie a primeira aula

```bash
npm run nova-aula -- logica cupom-negativo "O cupom que deixou o preço negativo"
```

Isso cria `courses/logica/lessons/01-cupom-negativo/` (o número é automático) com:

```
01-cupom-negativo/
├── plano.md      objetivo, mistério, exemplo, erro comum, desafio
├── roteiro.ts    as falas e as cenas: um exemplo COMPLETO que já renderiza
└── examples/     código que aparece na tela, com testes
```

**Dica:** renderize o exemplo antes de mudar qualquer coisa (passo 6). Assim você vê como cada linha do
roteiro vira vídeo.

### 4. Escreva o roteiro

Leia os padrões antes (10 minutos que economizam horas):

| Arquivo | O que ensina |
|---|---|
| [`docs/guides/lesson-structure.md`](docs/guides/lesson-structure.md) | os capítulos fixos de toda aula (formato "investigação") |
| [`docs/guides/writing-a-lesson.md`](docs/guides/writing-a-lesson.md) | todos os campos do roteiro e as cenas disponíveis |
| [`core/casts/example/editorial-guide.md`](core/casts/example/editorial-guide.md) | personalidade e regras de diálogo de Lia e Téo |
| [`docs/guides/lessons-learned.md`](docs/guides/lessons-learned.md) | erros que já aconteceram e como evitá-los |

Cada fala do `roteiro.ts` tem esta cara:

```ts
{
  id: '001', chapter: 1, speaker: 'teo',
  text: 'Um cliente [usou um cupom de desconto]... e [pagou mais caro].',   // legenda; [trecho] dispara uma ação
  say:  'Um cliente [usou um cupom de desconto]... <pausa 0.3> e [pagou mais caro].', // opcional: só para a voz
  pose: 'raise', expr: 'surprised', look: 'viewer',
  react: { expr: 'concerned' },                      // reação de quem está ouvindo
  scene: { kind: 'card', variant: 'ticket', title: 'Reclamação #4521', items: ['Usei o cupom', 'Paguei mais'], shown: 0 },
  beats: [{ shown: 1, sfx: 'pop' }, { shown: 2, sfx: 'error' }],   // uma ação por [trecho]
}
```

Coloque o código que vai aparecer na tela em `examples/`, com testes que passam (o aluno pode rodar).

> **Escrevendo com uma IA (opcional):** dê a ela os quatro arquivos da tabela acima, um roteiro pronto
> (por exemplo `courses/solid/lessons/01-por-que-codigo-apodrece/roteiro.ts`) e o seu `plano.md`, e peça:
> *"Escreva o roteiro.ts desta aula seguindo esses padrões"*. Revise o conteúdo técnico antes de renderizar.

### 5. Valide (sem gerar voz)

```bash
npm run check -- ../courses/logica/lessons/01-cupom-negativo
```

O comando roda os testes dos exemplos, confere os tipos do roteiro e monta a linha do tempo com a duração
estimada. Ele aponta erros como "3 [marcas] no texto, mas 2 beats".

### 6. Gere o vídeo

```bash
npm run render -- ../courses/logica/lessons/01-cupom-negativo
```

Saídas em `render/`: `aula-01.mp4` e `legendas.srt` (pronta para o YouTube).
Para ver e ajustar no navegador, quadro a quadro: `npm run studio`.

### 7. Ajuste e regrave só o que mudou

- **Palavra pronunciada errado?** Adicione a grafia que soa certo em `courses/<curso>/pronuncia.json`
  (`"deploy": "diplói"`). Só a voz muda; a legenda continua com o texto original.
- **Mudou uma fala?** Rode o `render` de novo: só as falas alteradas são regravadas.
- **Não gostou da entonação de uma fala?** Sorteie outra versão: `SEED=2 npm run tts -- <aula> 007`.
- **Uma fala precisa de outro tom?** No modelo 1.7b, dê uma instrução só para ela no roteiro:
  `style: 'Fale surpreso, quase sem acreditar'`. O estilo padrão de cada personagem fica no `npm run setup`.
- **Várias aulas de uma vez**, com controle de qualidade da pronúncia (Whisper):
  `npm run produce -- ../courses/logica/lessons/*`

### 8. Publique no YouTube (opcional)

`npm run youtube` envia a aula renderizada com título, descrição com capítulos, legendas, capa e playlist do curso.
A credencial é SUA e fica fora do repositório, em `~/.config/giz/youtube/`.

**Preparação (uma vez):**

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto (ou use um existente).
2. Em **APIs e serviços → Biblioteca**, ative a **YouTube Data API v3**.
3. Em **Tela de consentimento OAuth** (Google Auth Platform), configure o app como **Externo** e, em
   **Público-alvo → Usuários de teste**, adicione a conta Google dona do canal. Sem isso o login dá "acesso negado".
4. Em **Credenciais → Criar credenciais → ID do cliente OAuth**, escolha **App para computador** e baixe o JSON.
5. Salve o JSON exatamente neste caminho (crie a pasta com `mkdir -p ~/.config/giz/youtube`):
   `~/.config/giz/youtube/client_secret.json`
   - No Windows com WSL, a pasta aparece em `\\wsl.localhost\<distro>\home\<usuário>\.config\giz\youtube\`.
     Cuidado com dois tropeços comuns: o Windows pode salvar como `client_secret.json.json` (extensão escondida)
     e criar um arquivo `...:Zone.Identifier` ao lado; renomeie o primeiro e apague o segundo.
   - Proteja o arquivo: `chmod 600 ~/.config/giz/youtube/client_secret.json`.
6. Faça o login. O comando mostra um link; abra no navegador e autorize com a conta do canal:
   ```bash
   npm run youtube -- login
   ```
   - "O Google não verificou este app" é esperado em projeto pessoal: **Avançado → Acessar (não seguro)**.
   - No fim aparece "Pronto! Pode fechar esta aba." e o token fica em `~/.config/giz/youtube/token.json`.
   - Com o app em modo de **teste**, o Google expira o token em 7 dias: rode o `login` de novo quando o envio
     disser que não conseguiu renovar o token (ou publique o app na tela de consentimento para não expirar).
7. Para capa personalizada, o canal precisa estar verificado (verificação por telefone no YouTube).

**Uso:**

```bash
npm run youtube -- simular ../courses/logica/lessons/01-cupom-negativo      # mostra o que seria enviado, sem enviar
npm run youtube -- publicar ../courses/logica/lessons/01-cupom-negativo --privacidade unlisted
npm run youtube -- pendentes ../courses/logica --privacidade unlisted --vigiar   # publica cada aula assim que fica pronta
npm run youtube -- status ../courses/logica                                 # o que já foi publicado
```

O resultado de cada envio fica em `render/youtube.json` da aula (aula com esse arquivo não é reenviada; `--forcar`
reenvia). A privacidade padrão é `private`. As aulas são publicadas em ordem e cada uma entra na playlist do curso
(mesmo título do `curso.yaml`) na posição do seu número. Se a playlist já tiver uma versão anterior da mesma aula
(título com `#007` ou `Aula 007`), ela sai da playlist e vira privada — nunca é apagada. O formato do título é
configurável no `curso.yaml`: `youtube_titulo: "{curso} #{numero} - {titulo}"`.

As capas ficam em `courses/<curso>/capas/` (ou na pasta `capas:` do `curso.yaml`), com nome `Aula 01 - título.png`.
Atenção: a cota padrão da API permite umas 4 aulas por dia, e projetos de API não verificados pelo Google têm
os vídeos travados como privados até passarem pela auditoria da API.

## Personalizando (linha de comando)

| Quero… | Onde |
|---|---|
| trocar a voz, o idioma, a GPU ou a pasta dos modelos | `npm run setup` (grava no seu `giz.config.json`) |
| mudar as cores dos personagens | `look` em [`motor/src/cast.ts`](motor/src/cast.ts) |
| mudar as cores e fontes dos vídeos | [`motor/src/theme.ts`](motor/src/theme.ts) |
| criar um tipo de cena novo | `motor/src/types.ts` → `motor/src/scenes.tsx` → `SCENES` em `motor/src/Lesson.tsx` → [`docs/guides/scene-catalog.md`](docs/guides/scene-catalog.md) |
| usar outra voz (ElevenLabs, Azure, Kokoro…) | [`motor/scripts/tts.ts`](motor/scripts/tts.ts) |

Detalhes técnicos do motor: [`motor/README.md`](motor/README.md).

## Estrutura

```
giz/
├── studio/         o giz Estúdio (o aplicativo de computador, em Electron)
├── core/           o motor (roteiro em JSON → vídeo) e a CLI `giz`; o elenco de exemplo (Lia e Téo) em core/casts/example/
├── motor/          o motor antigo das aulas (Remotion + voz Qwen3-TTS local), usado pelo passo a passo acima
├── docs/guides/    formato da aula, catálogo de cenas, guia de escrita, lições aprendidas
├── templates/      modelos usados por novo-curso e nova-aula (course/ e lesson/)
└── courses/solid/  curso de exemplo (24 aulas em lessons/)
```

Áudios e vídeos gerados não vão para o git: o `render` gera tudo de novo.

## Limitações conhecidas

- As vozes prontas do Qwen3-TTS são nativas de outros idiomas (chinês, inglês, japonês, coreano). Elas falam
  português, mas podem ter um leve sotaque. Na linha de comando, use o `pronuncia.json` e o Whisper
  (`npm run produce`) para achar e corrigir palavras problemáticas.
- Gerar voz local na CPU é lento (veja "Requisitos"); com uma GPU NVIDIA fica bem mais rápido. Fica rápido nas
  rodadas seguintes, porque só as falas alteradas são regravadas.
- Personagens 2D não demonstram movimentos físicos com fidelidade (para isso, grave vídeo real).

## Licença

Código sob [MIT](LICENSE). Respeite também as licenças das ferramentas usadas (tabela no começo, em especial a do Remotion).
