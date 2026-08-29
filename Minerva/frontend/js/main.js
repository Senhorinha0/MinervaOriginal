// ============ ESTADO ============
const SUPABASE_URL = 'https://fzvacfpdcguryyspropb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SoKFhWheafzX6QaPsigOtA_c2ZjBT0W';
supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let usuarios = {};
let logado = null, saldoVisivel = true, loopAtivo = false;
let pizzaChart = null;
let tipoCadastro = 'aluno', tipoLoginSel = 'aluno';

// ============ TEMA (Claro/Escuro) ============
function aplicarTema(t){
  localStorage.setItem('minerva_tema', t);
  document.body.classList.toggle('tema-claro', t==='claro');
}
(function(){
  const salvo = localStorage.getItem('minerva_tema');
  if(salvo==='claro') document.body.classList.add('tema-claro');
})();
let gestaoAlunos = [], gestaoAlunoAtual = null;

// Código(s) de autorização válidos para criação de conta de Gestão.
// Segurança real fica a cargo do Supabase (trigger + tabela codigos_gestao) — ver script SQL.
const CODIGOS_GESTAO_FALLBACK = ['MINERVA-GESTAO-2026'];

// histórico de preços para mini-gráficos (últimos 20 ticks por ticker)
let historicoPrecos = {};

let mercado = {
  'PETR4':   { preco:38.50,  precoRef:38.50,  nome:'Petrobras' },
  'VALE3':   { preco:65.20,  precoRef:65.20,  nome:'Vale'      },
  'ITUB4':   { preco:33.15,  precoRef:33.15,  nome:'Itaú'      },
  'BTC/BRL': { preco:355000, precoRef:355000, nome:'Bitcoin'   },
};

for(const t in mercado) historicoPrecos[t] = [mercado[t].preco];

const premios = [
  { nome:'Fila Prioritária na Biblioteca', desc:'Direito de furar a fila e ser o primeiro a pegar livros emprestados por uma semana', valor:6000, icone:'<i class="ph ph-books"></i>' },
  { nome:'Sessão de Jogos', desc:'Tempo livre na sala de informática ou jogos de tabuleiro durante uma aula vaga', valor:9000, icone:'<i class="ph ph-game-controller"></i>' },
  { nome:'Aluno Monitor por um Dia', desc:'Ajuda o professor em pequenas tarefas da sala por um dia inteiro', valor:15000, icone:'<i class="ph ph-person-simple"></i>' },
  { nome:'Cinema', desc:'Ingresso para o cinema', valor:20000, icone:'<i class="ph ph-film-strip"></i>' },
  { nome:'Ingresso para Evento da Escola', desc:'Entrada garantida em uma peça de teatro, festa junina ou mostra cultural da escola', valor:25000, icone:'<i class="ph ph-masks-theater"></i>' },
  { nome:'Dia de Educação Física', desc:'Um dia na quadra, aula de educação física', valor:50000, icone:'<i class="ph ph-person-simple-run"></i>' },
];

// ============ MINERVA EDUCA — módulos, jogo e conquistas ============
const educaModulos = [
  { id:'nvd', icone:'<i class="ph ph-question"></i>', titulo:'Necessidade x Desejo', desc:'Aprenda a diferenciar o que é essencial do que é vontade.',
    conteudo:'Necessidade é tudo aquilo que você precisa para viver bem e funcionar no dia a dia: alimentação, saúde, moradia, transporte para a escola, material escolar. Desejo é o que você gostaria de ter, mas que pode esperar ou até nunca acontecer, como um tênis novo só porque é o modelo da moda, ou trocar de celular mesmo o atual funcionando perfeitamente. Nenhum dos dois é "errado" — desejos fazem parte da vida e também merecem espaço no orçamento. O problema é confundir os dois e tratar um desejo como se fosse urgente, gastando o dinheiro que deveria cobrir o essencial. Uma boa estratégia é, antes de qualquer compra, parar e perguntar: "isso é algo que eu preciso agora, ou é algo que eu só quero?". Se for desejo, dá para planejar: definir quanto custa, quanto tempo levará para juntar o valor e se realmente vale a pena esperar. Com o tempo, esse hábito de pausar antes de comprar se torna natural e evita boa parte dos arrependimentos financeiros.',
    perguntas:[
      { q:'Qual das opções abaixo é uma NECESSIDADE?', opcoes:['Comprar um tênis novo porque é o modelo da moda','Comprar material escolar para as aulas','Trocar de celular só para ter o mais recente'], certa:1 },
      { q:'Um DESEJO normalmente pode ser:', opcoes:['Adiado ou planejado com calma','Sempre satisfeito na hora, sem pensar','Ignorado sem nenhum impacto'], certa:0 },
      { q:'Remédios e alimentação básica são exemplos de:', opcoes:['Desejos','Necessidades','Luxos'], certa:1 },
      { q:'Antes de comprar algo, uma boa pergunta é:', opcoes:['Eu preciso disso ou só quero?','Todo mundo tem, então eu também preciso ter','Está caro, então deve ser bom'], certa:0 }
    ]},
  { id:'red', icone:'<i class="ph ph-chart-bar"></i>', titulo:'Receitas e Despesas', desc:'Entenda a diferença entre o que entra e o que sai do seu bolso.',
    conteudo:'Receita é todo o dinheiro que entra na sua vida: mesada, salário, prêmios, presentes em dinheiro, ou qualquer valor recebido de alguma forma. Despesa é todo o dinheiro que sai: contas fixas, alimentação, transporte, lazer, compras do dia a dia. A relação entre esses dois números é a base de toda a saúde financeira de uma pessoa. Quando as receitas são maiores que as despesas, sobra dinheiro — isso é chamado de superávit, e é o que permite poupar, investir ou realizar objetivos. Quando acontece o contrário, e as despesas ultrapassam as receitas, o resultado é o déficit: falta dinheiro, e a pessoa pode precisar recorrer a empréstimos ou deixar contas atrasadas, o que gera ainda mais problemas. Por isso, o primeiro passo de qualquer organização financeira é simplesmente saber, com clareza, quanto entra e quanto sai todo mês. Sem esse controle básico, é praticamente impossível planejar o futuro ou alcançar qualquer meta financeira.',
    perguntas:[
      { q:'Receita é...', opcoes:['Dinheiro que você recebe','Dinheiro que você gasta','Dinheiro que você perdeu'], certa:0 },
      { q:'Se as despesas forem maiores que as receitas, o resultado é:', opcoes:['Sobra de dinheiro','Déficit (faltou dinheiro)','Não faz diferença nenhuma'], certa:1 },
      { q:'Salário, mesada e prêmios recebidos são exemplos de:', opcoes:['Despesas','Receitas','Dívidas'], certa:1 },
      { q:'Pagar contas, comprar comida e lazer são exemplos de:', opcoes:['Receitas','Investimentos','Despesas'], certa:2 }
    ]},
  { id:'org', icone:'<i class="ph ph-folder-open"></i>', titulo:'Organização Financeira', desc:'Descubra como manter suas finanças em ordem.',
    conteudo:'Organizar as finanças é simplesmente saber, com detalhes, para onde o seu dinheiro está indo. Muita gente até ganha uma boa quantia, mas não sabe explicar depois onde ela foi parar — e é exatamente isso que a organização resolve. Anotar todos os gastos, mesmo os pequenos, é o primeiro passo: um lanche, uma passagem de ônibus, tudo soma no fim do mês. Separar o dinheiro por categorias, como escola, lazer, transporte e poupança, ajuda a visualizar em quais áreas você está gastando mais e onde talvez dê para cortar. Revisar essas anotações toda semana, ou pelo menos uma vez por mês, evita surpresas desagradáveis e permite corrigir o rumo antes que o problema fique grande. Um orçamento pessoal nada mais é do que esse plano organizado: uma previsão de quanto vai entrar, quanto vai sair e quanto deve sobrar, servindo como um mapa para guiar as decisões financeiras ao longo do tempo.',
    perguntas:[
      { q:'Anotar todos os gastos ajuda a:', opcoes:['Esquecer do dinheiro','Ter mais controle sobre o orçamento','Gastar mais sem perceber'], certa:1 },
      { q:'Separar o dinheiro por categorias (escola, lazer, poupança) é um exemplo de:', opcoes:['Desorganização','Organização financeira','Perda de tempo'], certa:1 },
      { q:'Um orçamento pessoal serve para:', opcoes:['Prever quanto vai entrar e sair de dinheiro','Esconder gastos','Impedir qualquer gasto'], certa:0 },
      { q:'Revisar seus gastos toda semana ajuda a:', opcoes:['Perder tempo à toa','Identificar onde o dinheiro está indo','Gastar mais sem culpa'], certa:1 }
    ]},
  { id:'met', icone:'<i class="ph ph-target"></i>', titulo:'Criação de Metas', desc:'Aprenda a planejar objetivos financeiros de verdade.',
    conteudo:'Uma meta financeira boa nunca é vaga como "quero juntar dinheiro" — ela precisa ter sempre um valor exato e um prazo definido, por exemplo: "juntar 200 pontos em 4 meses" ou "guardar para comprar um presente até dezembro". Quando a meta é clara, fica muito mais fácil saber se você está no caminho certo ou se precisa se esforçar mais. Uma técnica poderosa é dividir uma meta grande em partes menores: em vez de pensar nos 200 pontos de uma vez, pense em guardar 50 pontos por mês — parece bem mais alcançável, e cada pequena vitória motiva a continuar até o fim. Metas também ajudam a resistir a tentações do dia a dia: quando você sabe exatamente o que está buscando, fica mais fácil dizer não a um gasto por impulso que atrasaria o objetivo. No fundo, metas dão direção para o seu dinheiro — sem elas, é fácil gastar sem rumo e nunca conseguir realizar os planos maiores.',
    perguntas:[
      { q:'Uma boa meta financeira deve ter:', opcoes:['Nenhum prazo definido','Um valor e um prazo definidos','Só um valor, sem nenhum plano'], certa:1 },
      { q:'Guardar um pouco de dinheiro todo mês para comprar algo é:', opcoes:['Impulsividade','Planejamento de meta','Desperdício'], certa:1 },
      { q:'Dividir uma meta grande em metas menores é:', opcoes:['Uma boa estratégia para não desanimar','Uma perda de tempo','Impossível de fazer'], certa:0 },
      { q:'Se você quer juntar 200 pontos em 4 meses, deve guardar por mês:', opcoes:['200 pontos','50 pontos','Não precisa guardar nada'], certa:1 }
    ]},
  { id:'com', icone:'<i class="ph ph-shopping-cart"></i>', titulo:'Compras Inteligentes', desc:'Aprenda a pesquisar, comparar e economizar nas compras.',
    conteudo:'Comprar de forma inteligente não significa gastar menos o tempo todo, e sim gastar melhor. Antes de comprar algo caro, vale a pena pesquisar o preço em mais de um lugar — muitas vezes o mesmo produto tem valores bem diferentes dependendo de onde é comprado. Outra dica valiosa é comparar o preço por unidade, como o preço por 100g ou por litro, já que embalagens maiores nem sempre são mais baratas proporcionalmente. Fazer uma lista antes de ir ao mercado ou à loja também é fundamental: ela funciona como um guia que evita compras por impulso, mesmo quando tudo ao redor parece estar "em promoção" ou "só hoje". Vale lembrar que uma promoção só é vantajosa se você realmente precisar do produto — comprar algo barato que não será usado continua sendo desperdício de dinheiro. Comparar, pesquisar e planejar são os três pilares de quem faz compras inteligentes.',
    perguntas:[
      { q:'Antes de comprar algo caro, o ideal é:', opcoes:['Comprar o primeiro que ver','Pesquisar preços em outros lugares','Comprar por impulso'], certa:1 },
      { q:'Comprar algo só porque está na promoção, mesmo sem precisar, é:', opcoes:['Compra inteligente','Armadilha de consumo','Investimento'], certa:1 },
      { q:'Comparar o preço por unidade (ex: preço por 100g) ajuda a:', opcoes:['Confundir mais a compra','Fazer uma escolha mais econômica','Não faz diferença'], certa:1 },
      { q:'Fazer uma lista de compras antes de ir ao mercado ajuda a:', opcoes:['Gastar mais do que o planejado','Evitar compras por impulso','Não serve pra nada'], certa:1 }
    ]},
  { id:'pla', icone:'<i class="ph ph-calendar"></i>', titulo:'Planejamento', desc:'Veja como planejar o uso do seu dinheiro ao longo do tempo.',
    conteudo:'Planejar significa pensar no dinheiro antes de gastá-lo, e não apenas descobrir depois que ele acabou. É a diferença entre reagir aos problemas financeiros e se antecipar a eles. Um bom planejamento consegue olhar para o curto e para o longo prazo ao mesmo tempo: de um lado, as contas e compromissos deste mês; de outro, objetivos maiores que exigem tempo, como uma viagem, um curso ou um equipamento mais caro. Para planejar um gasto de longo prazo, é preciso organizar economias aos poucos ao longo do tempo, em vez de deixar tudo para resolver de última hora ou depender de empréstimos. Um cronograma financeiro simples — mesmo que seja só uma lista no papel ou no celular — ajuda a visualizar com antecedência o que vai entrar e o que vai sair, permitindo ajustar os gastos antes que os problemas apareçam. Quem planeja tem muito menos surpresas desagradáveis no fim do mês.',
    perguntas:[
      { q:'Planejar o dinheiro do mês ajuda a:', opcoes:['Evitar surpresas no fim do mês','Gastar sem pensar em nada','Não serve pra nada'], certa:0 },
      { q:'Um bom planejamento financeiro pensa em:', opcoes:['Só o presente','Curto e longo prazo','Só o passado'], certa:1 },
      { q:'Planejar um gasto de longo prazo, como uma viagem, exige:', opcoes:['Só pensar no momento da viagem','Organizar economias ao longo do tempo','Pedir emprestado sempre'], certa:1 },
      { q:'Um cronograma financeiro mensal ajuda a:', opcoes:['Visualizar entradas e saídas com antecedência','Esquecer dos compromissos','Aumentar os gastos'], certa:0 }
    ]},
  { id:'imp', icone:'<i class="ph ph-warning"></i>', titulo:'Imprevistos', desc:'Aprenda a se preparar para gastos inesperados.',
    conteudo:'Imprevistos são gastos que ninguém planeja e que podem acontecer a qualquer momento: um conserto inesperado, uma emergência de saúde, um aparelho que quebra do nada. Eles são diferentes de um gasto comum justamente porque não estavam no orçamento — e é aí que muita gente se desorganiza financeiramente, precisando pedir dinheiro emprestado ou usar o cartão de crédito às pressas. Ter uma reserva de dinheiro guardada especificamente para essas situações é o que evita que um imprevisto vire um problema muito maior, como uma dívida com juros altos. O ideal é que essa reserva de emergência consiga cobrir pelo menos alguns meses de despesas básicas, dando um tempo de segurança caso algo saia do controle. Construir essa reserva não precisa ser rápido: guardar um pouco todo mês, de forma constante, já cria com o tempo um "colchão" de segurança financeira que traz muito mais tranquilidade para o dia a dia.',
    perguntas:[
      { q:'Ter uma reserva de dinheiro guardada serve para:', opcoes:['Cobrir imprevistos','Gastar assim que cair na conta','Não serve pra nada'], certa:0 },
      { q:'Um imprevisto financeiro é:', opcoes:['Um gasto planejado com antecedência','Um gasto inesperado','Um tipo de investimento'], certa:1 },
      { q:'O ideal é que a reserva de emergência cubra:', opcoes:['Nenhum gasto','Alguns meses de despesas básicas','Só um dia de gastos'], certa:1 },
      { q:'Um exemplo de imprevisto financeiro é:', opcoes:['Pagar a mensalidade da escola','Um conserto inesperado','Comprar um presente planejado'], certa:1 }
    ]},
  { id:'eco', icone:'<i class="ph ph-piggy-bank"></i>', titulo:'Como Economizar', desc:'Pequenas atitudes que ajudam a guardar mais dinheiro.',
    conteudo:'Economizar não precisa ser radical nem significa deixar de aproveitar a vida — pequenas atitudes constantes já fazem uma diferença enorme com o tempo. Comparar preços em lugares diferentes antes de comprar, cortar gastos que não trazem benefício real e desligar aparelhos que não estão em uso são exemplos simples que qualquer pessoa pode aplicar no dia a dia. Uma técnica muito usada por quem tem sucesso ao economizar é "pagar-se primeiro": assim que o dinheiro chega, uma parte já é separada e guardada antes mesmo de pensar nos outros gastos, em vez de esperar para ver "o que sobra" no fim do mês — que, na prática, quase nunca sobra nada. Outra estratégia útil é revisar assinaturas, gastos repetidos e pequenos "vazamentos" de dinheiro que passam despercebidos, mas que somados representam um valor considerável. O segredo de quem economiza bem não é ganhar muito mais, e sim criar hábitos consistentes que se repetem todos os meses.',
    perguntas:[
      { q:'Uma forma simples de economizar é:', opcoes:['Anotar gastos e cortar o desnecessário','Gastar tudo assim que recebe','Nunca planejar nada'], certa:0 },
      { q:'Guardar uma parte do dinheiro antes de gastar o resto é conhecido como:', opcoes:['Pagar-se primeiro','Gastar tudo primeiro','Ignorar o orçamento'], certa:0 },
      { q:'Comparar preços em lugares diferentes antes de comprar é uma forma de:', opcoes:['Perder tempo','Economizar dinheiro','Gastar mais'], certa:1 },
      { q:'Desligar aparelhos que não estão em uso ajuda a:', opcoes:['Economizar energia e dinheiro','Aumentar a conta','Não faz diferença nenhuma'], certa:0 }
    ]},
  { id:'poup', icone:'<i class="ph ph-piggy-bank"></i>', titulo:'Poupança e Reserva de Emergência', desc:'Aprenda a importância de guardar dinheiro aos poucos.',
    conteudo:'Poupar é o hábito de guardar dinheiro regularmente, mesmo que seja pouco de cada vez — e é justamente esse hábito que importa mais do que o valor guardado em si, porque pequenas quantias somadas ao longo do tempo se transformam em valores relevantes. A reserva de emergência é um tipo especial de poupança: dinheiro guardado especificamente para cobrir imprevistos, sem precisar recorrer a empréstimos ou juros altos quando algo inesperado acontece. Diferente de uma poupança para realizar um desejo, a reserva de emergência deve ficar disponível e acessível a qualquer momento, pronta para ser usada quando necessário. O ideal é mantê-la em um lugar seguro e organizado, como uma conta bancária ou um cofrinho controlado — nunca espalhada em vários lugares da casa, onde é fácil perder o controle de quanto realmente existe guardado, ou até mesmo esquecer o dinheiro ou perdê-lo. Construir essa reserva aos poucos, com constância, é um dos passos mais importantes para ter tranquilidade financeira.',
    perguntas:[
      { q:'Guardar dinheiro regularmente, mesmo pouco, é chamado de:', opcoes:['Poupar','Gastar','Investir tudo de uma vez'], certa:0 },
      { q:'A reserva de emergência serve principalmente para:', opcoes:['Comprar coisas supérfluas','Cobrir imprevistos sem precisar pedir emprestado','Gastar assim que cai na conta'], certa:1 },
      { q:'Poupar uma pequena parte todo mês é mais eficaz porque:', opcoes:['Cria o hábito e soma com o tempo','Não faz diferença nenhuma','É melhor guardar tudo de uma vez só no fim do ano'], certa:0 },
      { q:'Onde é mais seguro guardar uma poupança do que debaixo do colchão?', opcoes:['Em uma conta ou cofrinho controlado','Espalhado pela casa','Emprestado para desconhecidos'], certa:0 }
    ]},
  { id:'jur', icone:'<i class="ph ph-chart-line-up"></i>', titulo:'Juros: Como Funcionam', desc:'Entenda o que são juros e como eles afetam seu dinheiro.',
    conteudo:'Juros podem ser entendidos como o "preço" de usar o dinheiro de outra pessoa por um tempo, ou, do outro lado, como o rendimento que você ganha ao deixar o seu próprio dinheiro guardado rendendo em algum lugar. Quando alguém pega dinheiro emprestado, paga de volta o valor original mais os juros; quando alguém guarda dinheiro rendendo, recebe de volta o valor original mais o rendimento gerado. Um conceito importante é o de juros compostos: com o tempo, o valor que já rendeu passa a render sobre si mesmo também, criando um efeito de "bola de neve" que faz o total crescer cada vez mais rápido — para o bem, quando você está poupando, e para o mal, quando você está devendo. É exatamente por isso que uma compra parcelada com juros altos costuma sair bem mais cara no final do que o preço original, às vezes até o dobro. Entender como os juros funcionam ajuda a fazer escolhas mais conscientes tanto na hora de guardar dinheiro quanto na hora de pegar algo emprestado ou parcelado.',
    perguntas:[
      { q:'Juros são:', opcoes:['Um desconto que você ganha','O custo de usar o dinheiro de outra pessoa (ou o rendimento de guardar o seu)','Um imposto obrigatório'], certa:1 },
      { q:'Se você deixa dinheiro guardado rendendo juros, com o tempo ele:', opcoes:['Diminui sempre','Pode crescer','Fica congelado, sem mudar'], certa:1 },
      { q:'Pagar uma compra parcelada com juros altos normalmente faz você:', opcoes:['Pagar menos no total','Pagar mais no total','Pagar exatamente o mesmo valor'], certa:1 },
      { q:'Juros compostos significam que:', opcoes:['Os juros incidem só uma vez','Os juros passam a render sobre juros anteriores também','Não existem na prática'], certa:1 }
    ]},
  { id:'inv', icone:'<i class="ph ph-chart-line-up"></i>', titulo:'Introdução aos Investimentos', desc:'Primeiros passos para entender como investir com consciência.',
    conteudo:'Investir é usar o dinheiro com a intenção de fazê-lo crescer no futuro, diferente de apenas gastá-lo ou deixá-lo parado sem nenhum rendimento. Existem diferentes formas de investir, com níveis diferentes de risco e retorno, e por isso o primeiro passo antes de investir é sempre estudar e entender exatamente onde o dinheiro está sendo aplicado — nunca aplicar em algo que você não compreende bem. Uma regra muito importante é a diversificação: evitar colocar todo o dinheiro em um único lugar, distribuindo entre opções diferentes, o que reduz bastante o risco de perder tudo caso algo dê errado em um investimento específico. Também é essencial desconfiar de promessas de retorno muito alto, rápido e garantido, já que investimentos de verdade sempre envolvem algum grau de risco e não conseguem prometer ganhos certos — esse tipo de promessa é, na grande maioria das vezes, sinal de golpe. Investir bem começa com paciência, estudo e desconfiança saudável de "milagres financeiros".',
    perguntas:[
      { q:'Investir significa:', opcoes:['Gastar todo o dinheiro em lazer','Usar o dinheiro com a intenção de fazê-lo crescer no futuro','Guardar dinheiro embaixo do colchão'], certa:1 },
      { q:'Um investimento com retorno muito alto e garantido, prometido em pouco tempo, geralmente é:', opcoes:['Uma ótima oportunidade, sem riscos','Um possível golpe, é bom desconfiar','Sempre confiável'], certa:1 },
      { q:'Antes de investir, é importante:', opcoes:['Aplicar tudo de uma vez em algo desconhecido','Estudar e entender onde o dinheiro está sendo aplicado','Seguir apenas o que os amigos fazem'], certa:1 },
      { q:'Diversificar investimentos (não colocar tudo em um só lugar) ajuda a:', opcoes:['Aumentar o risco desnecessariamente','Reduzir o risco geral','Não faz diferença nenhuma'], certa:1 }
    ]},
  { id:'cred', icone:'<i class="ph ph-credit-card"></i>', titulo:'Crédito e Empréstimos', desc:'Saiba como usar o crédito de forma responsável.',
    conteudo:'Pedir dinheiro emprestado, ou usar crédito, significa que você está recebendo um valor agora com o compromisso de devolvê-lo depois, quase sempre com juros embutidos. Isso não é necessariamente algo ruim — o crédito pode ser uma ferramenta útil em momentos importantes, como financiar um estudo ou lidar com uma emergência —, mas precisa ser usado com muita responsabilidade. Antes de pegar qualquer empréstimo, é essencial verificar com atenção as taxas de juros cobradas e calcular, com honestidade, se realmente dá para pagar as parcelas nos meses seguintes sem comprometer outras contas. Usar crédito para comprar coisas que você sabe que não vai conseguir pagar depois é um sinal claro de alerta, e pode ser o início de um ciclo de endividamento difícil de sair. Por outro lado, um bom uso do crédito significa usá-lo de forma planejada, sabendo exatamente quando e como vai pagar, sem depender dele para cobrir gastos do dia a dia.',
    perguntas:[
      { q:'Pedir dinheiro emprestado (crédito) significa que você:', opcoes:['Vai precisar devolver o valor, geralmente com juros','Ganhou um presente sem compromisso','Nunca precisa devolver'], certa:0 },
      { q:'Antes de pegar um empréstimo, é importante verificar:', opcoes:['Apenas se o dinheiro cai rápido na conta','As taxas de juros e se dá para pagar as parcelas','Nada, pode pegar sem pensar'], certa:1 },
      { q:'Usar crédito para comprar coisas que você não consegue pagar depois é um sinal de:', opcoes:['Boa administração financeira','Alerta: pode levar ao endividamento','Investimento inteligente'], certa:1 },
      { q:'Um bom uso do crédito é:', opcoes:['Usar sem controle nenhum','Usar de forma planejada, sabendo que vai pagar em dia','Ignorar completamente as parcelas'], certa:1 }
    ]},
  { id:'cartao', icone:'<i class="ph ph-bank"></i>', titulo:'Uso Consciente do Cartão', desc:'Aprenda a usar o cartão sem perder o controle dos gastos.',
    conteudo:'Usar o cartão sem acompanhar os gastos é uma das formas mais comuns de perder o controle do orçamento, justamente porque o dinheiro "não sai da carteira na hora" — é fácil comprar sem perceber o quanto já foi gasto no mês, já que não há a sensação imediata de estar pagando. Por isso, é importante criar o hábito de, antes de cada compra no cartão, se perguntar: "isso realmente cabe no meu orçamento deste mês?". Guardar os comprovantes das compras e revisar a fatura regularmente ajuda a detectar erros, cobranças indevidas e a manter uma visão clara de tudo o que foi gasto. Gastar mais do que o limite planejado no cartão, mesmo estando dentro do limite disponível na função, é um sinal de falta de planejamento que pode levar a dificuldades no pagamento da fatura. Usado com consciência, o cartão é uma ferramenta prática e segura; usado sem controle, pode se tornar uma armadilha de gastos invisíveis.',
    perguntas:[
      { q:'Usar o cartão para tudo, sem acompanhar os gastos, pode:', opcoes:['Ajudar a economizar automaticamente','Fazer você perder o controle do quanto está gastando','Não ter nenhum efeito'], certa:1 },
      { q:'Antes de usar o cartão em uma compra, é bom perguntar:', opcoes:['Isso cabe no meu orçamento?','Qual é a cor do cartão?','Quantas pessoas têm esse cartão?'], certa:0 },
      { q:'Guardar comprovantes e acompanhar a fatura ajuda a:', opcoes:['Confundir ainda mais as contas','Detectar erros e controlar os gastos','Não serve para nada'], certa:1 },
      { q:'Gastar mais do que o limite planejado no cartão é um exemplo de:', opcoes:['Boa organização financeira','Falta de planejamento','Investimento'], certa:1 }
    ]},
  { id:'div', icone:'<i class="ph ph-prohibit"></i>', titulo:'Dívidas: Como Evitar', desc:'Entenda o que são dívidas e como não cair nelas.',
    conteudo:'Uma dívida acontece sempre que você deve dinheiro para alguém ou para uma instituição, seja um empréstimo, uma fatura em atraso ou uma parcela não paga. Ter uma dívida pontual, planejada e sob controle não é um problema em si — o perigo surge quando as dívidas se acumulam e passam a comprometer boa parte da renda com juros e multas. A melhor forma de evitar cair nessa situação é planejar os gastos de acordo com o que realmente entra de dinheiro, evitando gastar além da própria capacidade, e priorizar sempre o pagamento das contas em dia, já que atrasos costumam gerar juros extras que aumentam o valor total devido. Caso as dívidas já tenham começado a se acumular, o caminho correto é reunir todas as informações, organizar as contas com clareza e, se necessário, buscar ajuda especializada para reequilibrar a situação — nunca simplesmente ignorar o problema, torcendo para que ele desapareça sozinho, pois isso normalmente só o torna maior.',
    perguntas:[
      { q:'Uma dívida acontece quando:', opcoes:['Você recebe mais do que gasta','Você deve dinheiro para alguém ou alguma instituição','Você guarda dinheiro na poupança'], certa:1 },
      { q:'Uma forma de evitar dívidas é:', opcoes:['Gastar mais do que ganha','Planejar os gastos de acordo com a renda','Ignorar as contas'], certa:1 },
      { q:'Se as dívidas começarem a se acumular, o ideal é:', opcoes:['Ignorar e continuar gastando','Organizar as contas e buscar ajuda para reequilibrar','Pedir mais empréstimos sem pensar'], certa:1 },
      { q:'Pagar contas em dia ajuda a:', opcoes:['Evitar juros e multas extras','Aumentar a dívida','Não faz diferença'], certa:0 }
    ]},
  { id:'bancos', icone:'<i class="ph ph-bank"></i>', titulo:'Serviços Bancários', desc:'Conheça como funcionam contas, PIX e extratos bancários.',
    conteudo:'Uma conta bancária serve como um espaço seguro para guardar e movimentar dinheiro, evitando os riscos de manter grandes quantias em espécie. O PIX é uma forma de transferência instantânea entre contas, disponível a qualquer hora do dia, todos os dias da semana, e revolucionou a forma como as pessoas enviam e recebem dinheiro no Brasil. O extrato bancário é o registro detalhado de tudo o que entrou e saiu da conta, e verificá-lo regularmente ajuda a identificar movimentações, cobranças indevidas e possíveis erros antes que se tornem um problema maior. Um dos cuidados mais importantes ao usar serviços bancários é a segurança: a senha bancária nunca deve ser compartilhada com ninguém, seja por mensagem, telefone ou pessoalmente, pois é ela que protege a conta contra fraudes e acessos indevidos. Conhecer bem os serviços que um banco oferece — conta, PIX, extrato, cartão — é essencial para usar o dinheiro de forma prática e, ao mesmo tempo, segura.',
    perguntas:[
      { q:'Uma conta bancária serve para:', opcoes:['Guardar e movimentar dinheiro com segurança','Aumentar o dinheiro magicamente','Substituir a necessidade de planejar gastos'], certa:0 },
      { q:'O PIX é um exemplo de:', opcoes:['Um tipo de investimento de risco','Uma forma de transferência instantânea de dinheiro','Um empréstimo bancário'], certa:1 },
      { q:'Verificar o extrato bancário regularmente ajuda a:', opcoes:['Identificar movimentações e possíveis erros','Confundir ainda mais as finanças','Não é necessário nunca'], certa:0 },
      { q:'É importante nunca compartilhar sua senha bancária porque:', opcoes:['Isso é apenas uma formalidade sem importância','Protege sua conta contra fraudes e uso indevido','A senha não tem relação com segurança'], certa:1 }
    ]},
  { id:'public', icone:'<i class="ph ph-megaphone"></i>', titulo:'Consumismo e Publicidade', desc:'Entenda como a propaganda influencia suas decisões de compra.',
    conteudo:'Propagandas e publicidade costumam usar estratégias cuidadosamente pensadas para despertar o desejo de compra, mesmo quando o produto não é realmente necessário. Frases como "edição limitada", "só hoje" ou "últimas unidades" criam uma sensação de urgência, fazendo a pessoa decidir rápido, sem tempo para pensar se aquilo realmente faz sentido para ela. As redes sociais e os influenciadores digitais também têm um papel enorme nesse processo: comprar algo só porque alguém famoso divulgou, sem parar para avaliar se você realmente precisa daquilo, é um exemplo clássico de consumismo por impulso, movido mais pela emoção do momento do que por uma necessidade real. Uma forma simples e eficaz de resistir a essa pressão é dar um tempo antes de decidir — esperar um dia, ou mesmo algumas horas, costuma ser suficiente para perceber se o desejo de compra ainda continua forte ou se ele já passou. Entender essas estratégias de publicidade não significa nunca mais comprar nada por impulso, mas sim aprender a reconhecer quando uma decisão está sendo tomada por pressão externa, e não por escolha própria.',
    perguntas:[
      { q:'Propagandas costumam usar estratégias para:', opcoes:['Informar de forma neutra, sem nenhuma intenção','Despertar o desejo de compra','Sempre mostrar todos os defeitos do produto'], certa:1 },
      { q:'Comprar algo só porque um influenciador divulgou, sem pensar se você precisa, é:', opcoes:['Uma decisão consciente','Consumismo por impulso','Sempre um bom negócio'], certa:1 },
      { q:'Uma forma de resistir à pressão do consumo é:', opcoes:['Comprar tudo o que vê primeiro','Esperar um tempo antes de decidir se realmente precisa','Comparar apenas com o que os amigos têm'], certa:1 },
      { q:'"Edição limitada" e "só hoje" são frases usadas para:', opcoes:['Criar urgência e incentivar a compra rápida','Ajudar você a economizar','Não têm nenhuma intenção comercial'], certa:0 }
    ]},
  { id:'golpes', icone:'<i class="ph ph-shield-check"></i>', titulo:'Golpes e Segurança Financeira', desc:'Aprenda a se proteger de fraudes e golpes financeiros.',
    conteudo:'Golpes financeiros existem há muito tempo, mas se tornaram ainda mais comuns com a internet e os aplicativos de mensagem, já que os golpistas conseguem entrar em contato com muitas pessoas ao mesmo tempo e com pouco esforço. Uma regra praticamente universal é: nenhuma instituição séria, como um banco, pede sua senha, código de segurança ou dados completos do cartão por mensagem, telefone ou e-mail — se isso acontecer, é quase certeza de que se trata de um golpe. Promessas de "dinheiro fácil e rápido", sorteios inesperados ou oportunidades "exclusivas demais para serem verdade" quase sempre escondem fraudes, criadas exatamente para aproveitar a empolgação e a pressa da vítima. Antes de clicar em qualquer link recebido por mensagem pedindo dados bancários, o ideal é desconfiar por padrão e verificar a fonte diretamente pelos canais oficiais, nunca pelo link enviado. E caso você perceba uma cobrança estranha na sua própria conta, o mais indicado é contatar o banco imediatamente para verificar e, se necessário, bloquear o que for preciso, em vez de esperar para ver se o problema "se resolve sozinho".',
    perguntas:[
      { q:'Se alguém pede sua senha bancária por mensagem, você deve:', opcoes:['Enviar rapidamente para não perder tempo','Nunca enviar, isso é sinal de golpe','Enviar apenas se pedirem educadamente'], certa:1 },
      { q:'Uma promessa de "dinheiro fácil e rápido" geralmente é:', opcoes:['Sempre verdadeira','Um possível sinal de golpe','Uma boa oportunidade de investimento'], certa:1 },
      { q:'Antes de clicar em um link recebido por mensagem pedindo dados bancários, o ideal é:', opcoes:['Clicar sem pensar','Desconfiar e verificar a fonte antes','Compartilhar com mais pessoas'], certa:1 },
      { q:'Se você perceber uma cobrança estranha na sua conta, deve:', opcoes:['Ignorar completamente','Verificar e contatar o banco se necessário','Fingir que não viu'], certa:1 }
    ]},
  { id:'impostos', icone:'<i class="ph ph-receipt"></i>', titulo:'Impostos: O Básico', desc:'Entenda para que servem os impostos e como eles aparecem no dia a dia.',
    conteudo:'Impostos são valores que praticamente todas as pessoas pagam ao governo de alguma forma, muitas vezes sem perceber diretamente, já que eles costumam estar embutidos em quase tudo que compramos, além de aparecerem também descontados no salário de quem trabalha formalmente. Esse dinheiro arrecadado não desaparece: ele é usado, em teoria, para financiar serviços públicos essenciais, como escolas, hospitais, estradas, segurança e outros investimentos que beneficiam a população em geral. Entender que o preço final de um produto já inclui uma parte de impostos ajuda a compreender por que as coisas custam o que custam, e por que produtos parecidos podem ter preços bem diferentes dependendo de onde e como são vendidos. Cumprir corretamente as obrigações com os impostos, dentro do que é devido, é parte de como uma sociedade se organiza para manter serviços que todos usam, mesmo que os efeitos nem sempre sejam visíveis no dia a dia. Já deixar de pagar o que é devido, de forma irregular, prejudica diretamente a qualidade desses serviços públicos para todos.',
    perguntas:[
      { q:'Para que servem, principalmente, os impostos pagos por todos?', opcoes:['Para enriquecer uma única pessoa','Para financiar serviços públicos como escolas e hospitais','Para não terem nenhuma utilidade'], certa:1 },
      { q:'Quando você compra um produto na loja, o preço final:', opcoes:['Nunca inclui nenhum imposto','Geralmente já inclui impostos embutidos','Só inclui imposto se você pedir nota'], certa:1 },
      { q:'Uma pessoa que declara e paga seus impostos corretamente está:', opcoes:['Cumprindo uma obrigação que sustenta serviços públicos','Perdendo dinheiro à toa','Fazendo algo opcional e sem sentido'], certa:0 },
      { q:'Sonegar impostos (não pagar o que é devido) é:', opcoes:['Uma prática recomendada','Uma infração que prejudica os serviços públicos','Algo sem nenhuma consequência'], certa:1 }
    ]},
  { id:'empreende', icone:'<i class="ph ph-rocket"></i>', titulo:'Empreendedorismo Jovem', desc:'Primeiros passos para transformar uma ideia em uma pequena renda.',
    conteudo:'Empreender é, no fundo, identificar um problema, uma necessidade ou uma oportunidade e criar algo que resolva isso, transformando essa solução em uma fonte de renda. Não precisa ser algo grande ou complicado para começar: vender doces na escola, prestar um pequeno serviço para vizinhos, criar produtos artesanais ou até oferecer aulas particulares já são formas reais de empreender. Antes de começar qualquer pequeno negócio, é importante calcular com cuidado todos os custos envolvidos — materiais, tempo, transporte — para então definir um preço justo, que cubra esses custos e ainda gere um lucro razoável. Também vale planejar, desde o início, como o dinheiro ganho será usado: parte pode ser reinvestida no próprio negócio, para comprar mais material ou melhorar o produto, e parte pode ser guardada como lucro pessoal ou reserva. Ouvir os clientes, entender o que eles realmente precisam e estar disposto a melhorar constantemente são características de quem consegue fazer um pequeno empreendimento crescer com o tempo.',
    perguntas:[
      { q:'Empreender significa, basicamente:', opcoes:['Esperar o dinheiro cair do céu','Criar algo que resolve um problema e gera renda','Copiar exatamente o que outra pessoa faz'], certa:1 },
      { q:'Antes de vender um produto, é importante calcular:', opcoes:['Nenhum custo, só definir um preço qualquer','Os custos de produção para definir um preço justo','Apenas o preço da concorrência, sem mais nada'], certa:1 },
      { q:'Reinvestir parte do lucro de um pequeno negócio serve para:', opcoes:['Fazer o negócio crescer com o tempo','Atrapalhar o crescimento','Não tem nenhuma utilidade'], certa:0 },
      { q:'Um bom empreendedor costuma:', opcoes:['Ignorar o que os clientes precisam','Ouvir os clientes e melhorar o que oferece','Nunca planejar nada'], certa:1 }
    ]},
  { id:'consciente', icone:'<i class="ph ph-plant"></i>', titulo:'Consumo Consciente', desc:'Veja como suas escolhas de compra também afetam o mundo ao redor.',
    conteudo:'Consumo consciente é o hábito de pensar não só no preço de um produto, mas também no impacto real que aquela compra tem, tanto para a sua própria vida financeira quanto para o mundo ao redor. Antes de comprar, algumas perguntas ajudam a decidir com mais clareza: será que eu preciso mesmo disso, ou é só um impulso do momento? Esse produto vai durar bastante tempo, ou vai virar lixo em poucas semanas? De onde vem esse produto e como ele foi produzido? Comprar menos, porém melhor, priorizando qualidade e durabilidade em vez de quantidade, costuma economizar dinheiro a longo prazo, mesmo que o preço inicial pareça um pouco mais alto. Cuidar bem do que já se possui, consertando em vez de descartar sempre que possível, e evitar o desperdício de alimentos, roupas e outros recursos são atitudes simples que fazem diferença tanto no bolso quanto no meio ambiente. Doar ou repassar objetos que não são mais usados, em vez de simplesmente jogar fora, também é uma forma prática de consumo consciente que beneficia outras pessoas.',
    perguntas:[
      { q:'Consumo consciente significa, principalmente:', opcoes:['Comprar o máximo possível sempre que puder','Pensar no real motivo e no impacto de cada compra','Nunca comprar absolutamente nada'], certa:1 },
      { q:'Cuidar bem de um objeto para ele durar mais tempo é uma atitude de:', opcoes:['Desperdício','Consumo consciente','Consumismo'], certa:1 },
      { q:'Comprar um produto só para "acompanhar a moda", mesmo sem precisar, tende a gerar:', opcoes:['Economia e satisfação duradoura','Gastos desnecessários e desperdício','Nenhum efeito relevante'], certa:1 },
      { q:'Doar ou repassar algo que não usa mais, em vez de jogar fora, é um exemplo de:', opcoes:['Desperdício de tempo','Consumo consciente','Prejuízo financeiro'], certa:1 }
    ]}
];

const educaSituacao = {
  id:'sit-decisoes', icone:'<i class="ph ph-game-controller"></i>', titulo:'Situação: Seu Primeiro Salário',
  desc:'Tome decisões financeiras em um pequeno jogo de situações reais.',
  cenas:[
    { texto:'Você recebeu 100 pontos de mesada. O que fazer primeiro?',
      opcoes:[
        { texto:'Gastar tudo em lanches e joguinhos', feedback:'Gastar tudo de uma vez pode deixar você sem nada para imprevistos.' },
        { texto:'Guardar uma parte antes de gastar o resto', feedback:'Ótima escolha! Guardar uma parte primeiro é um hábito de quem organiza bem o dinheiro.' }
      ]},
    { texto:'Surgiu uma promoção de um tênis que você não precisa muito, mas está com 50% de desconto.',
      opcoes:[
        { texto:'Comprar na hora, afinal está barato', feedback:'Cuidado: comprar por impulso, mesmo com desconto, pode não ser necessário.' },
        { texto:'Pensar se realmente precisa antes de decidir', feedback:'Muito bem! Parar para pensar evita gastos desnecessários.' }
      ]},
    { texto:'No fim do mês, sobrou um pouco de dinheiro. O que fazer?',
      opcoes:[
        { texto:'Guardar para uma meta ou imprevisto', feedback:'Excelente! Isso é planejamento financeiro na prática.' },
        { texto:'Gastar tudo porque "já é seu"', feedback:'Gastar tudo sem pensar dificulta alcançar objetivos maiores.' }
      ]}
  ]
};

// ------ Vídeo-aulas (conteúdo oficial e institucional sobre educação financeira) ------
const educaVideos = [
  { id:'BcjojHO5840', titulo:'Como ensinar finanças na adolescência?', fonte:'Banco Central do Brasil — BC te Explica' },
  { id:'KvXhMSkbNis', titulo:'Como lidar com dinheiro e finanças desde criança?', fonte:'Banco Central do Brasil — BC te Explica' },
  { id:'TLYGUf8gO6Y', titulo:'Finanças também é coisa de criança', fonte:'Intus Forma' }
];

const conquistasDef = [
  { id:'primeira-meta', icone:'<i class="ph ph-medal"></i>', titulo:'Primeira Meta', desc:'Criou sua primeira meta.', check:d=>d.metas.length>0 },
  { id:'primeiro-milhar', icone:'<i class="ph ph-currency-circle-dollar"></i>', titulo:'Primeiro Milhar', desc:'Acumulou 1.000 Minervas.', check:d=>(d.educa.minervas||0)>=1000 },
  { id:'meta-alcancada', icone:'<i class="ph ph-target"></i>', titulo:'Meta Alcançada', desc:'Completou uma meta.', check:d=>d.metas.some(m=>m.concluida) },
  { id:'aluno-dedicado', icone:'<i class="ph ph-books"></i>', titulo:'Aluno Dedicado', desc:'Completou várias atividades do Minerva Educa.', check:d=>(d.educa.atividadesConcluidas||[]).length>=3 },
  { id:'mente-financeira', icone:'<i class="ph ph-brain"></i>', titulo:'Mente Financeira', desc:'Concluiu desafios do Minerva Educa.', check:d=>(d.educa.atividadesConcluidas||[]).length>=6 },
  { id:'mestre-minerva', icone:'<i class="ph ph-trophy"></i>', titulo:'Mestre Minerva', desc:'Completou toda a jornada de educação financeira.', check:d=>(d.educa.atividadesConcluidas||[]).length>=(educaModulos.length+1) },
  { id:'primeiro-passo', icone:'<i class="ph ph-rocket"></i>', titulo:'Primeiro Passo', desc:'Completou a primeira atividade do Minerva Educa.', check:d=>(d.educa.atividadesConcluidas||[]).length>=1 },
  { id:'jogador-experiente', icone:'<i class="ph ph-game-controller"></i>', titulo:'Jogador Experiente', desc:'Completou o jogo de situações do Minerva Educa.', check:d=>(d.educa.atividadesConcluidas||[]).includes('sit-decisoes') },
  { id:'nivel-cinco', icone:'⭐', titulo:'Nível 5', desc:'Alcançou o nível 5 no Minerva Educa.', check:d=>(Math.floor((d.educa.xp||0)/100)+1)>=5 },
  { id:'nivel-dez', icone:'<i class="ph ph-star-four"></i>', titulo:'Nível 10', desc:'Alcançou o nível 10 no Minerva Educa.', check:d=>(Math.floor((d.educa.xp||0)/100)+1)>=10 },
  { id:'planejador', icone:'<i class="ph ph-map"></i>️', titulo:'Planejador', desc:'Criou 3 ou mais metas.', check:d=>d.metas.length>=3 },
  { id:'multi-metas', icone:'<i class="ph ph-flag-checkered"></i>', titulo:'Colecionador de Metas', desc:'Completou 3 ou mais metas.', check:d=>d.metas.filter(m=>m.concluida).length>=3 },
  { id:'pix-ativo', icone:'<i class="ph ph-lightning"></i>', titulo:'Pix Ativo', desc:'Enviou seu primeiro PIX.', check:d=>d.historico.some(h=>h.includes('PIX ENVIADO')) },
  { id:'investidor', icone:'<i class="ph ph-chart-line-up"></i>', titulo:'Investidor', desc:'Possui ações ou criptomoedas na carteira.', check:d=>d.carteira&&Object.values(d.carteira).some(q=>q>0) },
  { id:'movimentado', icone:'<i class="ph ph-clipboard-text"></i>', titulo:'Conta Movimentada', desc:'Realizou 10 ou mais movimentações.', check:d=>d.historico.length>=10 },
  { id:'rico-em-pontos', icone:'<i class="ph ph-diamond"></i>', titulo:'Rico em Pontos', desc:'Acumulou 10.000 pontos no saldo.', check:d=>d.saldo>=10000 },
  { id:'trocador', icone:'<i class="ph ph-gift"></i>', titulo:'Trocador', desc:'Resgatou um prêmio na loja de Trocas.', check:d=>d.historico.some(h=>h.includes('TROCA')) },
  { id:'guardiao-do-dinheiro', icone:'<i class="ph ph-shield-check"></i>', titulo:'Guardião do Dinheiro', desc:'Fez um aporte em alguma meta.', check:d=>d.historico.some(h=>h.includes('APORTE META')) }
];

// ============ UTILS ============
const fmt  = v => Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const hora = () => new Date().toLocaleTimeString('pt-BR');
const parseValor = s => parseFloat(String(s).replace(/\./g,'').replace(',','.'));
const salvar = () => localStorage.setItem('usuarios_minerva',JSON.stringify(usuarios));
const gerarConta = () => String(Math.floor(10000+Math.random()*89999));
const gerarAuth  = () => Math.random().toString(36).slice(2,10).toUpperCase()+Math.random().toString(36).slice(2,6).toUpperCase();

// ============ MINERVA EDUCA — persistência local (progresso de XP/Minervas) ============
const chaveEduca = u => 'minerva_educa_'+u;
function carregarEduca(u){
  try{
    const raw=localStorage.getItem(chaveEduca(u));
    if(raw){
      const obj=JSON.parse(raw);
      return { minervas:obj.minervas||0, xp:obj.xp||0, atividadesConcluidas:obj.atividadesConcluidas||[], conquistasVistas:obj.conquistasVistas||[] };
    }
  }catch(e){}
  return { minervas:0, xp:0, atividadesConcluidas:[], conquistasVistas:[] };
}
function salvarEduca(){
  if(!logado||!usuarios[logado]) return;
  localStorage.setItem(chaveEduca(logado), JSON.stringify(usuarios[logado].educa));
}

// ============ NOTIFICAÇÃO ============
function notif(msg,tipo='ok'){
  const el=document.createElement('div');
  el.className=`notif ${tipo}`;
  el.innerHTML=`<span>${{ok:'<i class="ph ph-check-circle"></i>',erro:'<i class="ph ph-x-circle"></i>',info:'<i class="ph ph-info"></i>'}[tipo]||'<i class="ph ph-info"></i>'}</span><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(()=>el.classList.add('show'),50);
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400);},4500);
}

// ============ MODAL ============
let _modalCb=null;
function modal(titulo,corpo,cb,ocultarBtns=false){
  document.getElementById('modalTitulo').innerHTML=titulo;
  document.getElementById('modalCorpo').innerHTML=corpo;
  _modalCb=cb;
  document.getElementById('modalConfirmar').onclick=()=>cb&&cb();
  document.getElementById('modalBtns').style.display=ocultarBtns?'none':'flex';
  document.getElementById('modalBg').classList.remove('hidden');
  const inp=document.querySelector('#modalBox input');
  if(inp) setTimeout(()=>inp.focus(),100);
}
function fecharModal(){document.getElementById('modalBg').classList.add('hidden');}
  function abrirInfo(tipo){

    let titulo="";
    let texto="";

    switch(tipo){

        case "financeiro":
            titulo="<i class='ph ph-money'></i> Controle Financeiro";

            texto=`
            <h3>Organize toda sua vida financeira.</h3>

            <ul>
                <li><i class="ph ph-check"></i> Controle receitas e despesas</li>
                <li><i class="ph ph-check"></i> Histórico completo</li>
                <li><i class="ph ph-check"></i> Gráficos inteligentes</li>
                <li><i class="ph ph-check"></i> Controle do orçamento</li>
                <li><i class="ph ph-check"></i> Acompanhamento em tempo real</li>
            </ul>
            `;
        break;

        case "MinervaEduca":
            titulo="<i class='ph ph-books'></i> Minerva educa";

            texto=`
            <h3>Entenda um pouco mais sobre educação financeira</h3>

            <ul>
                <li><i class="ph ph-check"></i> Quizes</li>
                <li><i class="ph ph-check"></i> Vídeos aulas</li>
                <li><i class="ph ph-check"></i> Textos explicativos </li>
                <li><i class="ph ph-check"></i> </li>
            </ul>
            `;
        break;

        case "Trocas":

            titulo="<i class='ph ph-gift'></i> Trocas";

            texto=`
            <h3>Troque seus pontos por prêmios.</h3>

            <ul>
                <li><i class="ph ph-check"></i> Um dia de aula na quadra</li>
                <li><i class="ph ph-check"></i> Cinema</li>
                <li><i class="ph ph-check"></i> Escolha uma música para o sinal</li>
                <li><i class="ph ph-check"></i> ...</li>
            </ul>
            `;
        break;

        case "pix":

            titulo="<i class='ph ph-lightning'></i> PIX Instantâneo";

            texto=`
            <h3>Transferências em segundos.</h3>

            <ul>
                <li><i class="ph ph-check"></i> PIX 24 horas</li>
                <li><i class="ph ph-check"></i> QR Code</li>
                <li><i class="ph ph-check"></i> Copia e Cola</li>
                <li><i class="ph ph-check"></i> Comprovante automático</li>
            </ul>
            `;
        break;

    }

    modal(titulo,texto,null,true);

}
// ============ NAVEGAÇÃO ============
function ir(id){
  ['telaInicial','telaLogin','telaCadastro'].forEach(t=>{
    const el=document.getElementById(t); if(el) el.classList.add('hidden');
  });
  const el=document.getElementById(id); if(el) el.classList.remove('hidden');
}

function aba(btn,nome){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('ativo'));
  btn.classList.add('ativo');
  renderAba(nome);
}
function abaNav(nome){
  const mapa=['financeiro','extrato','pix','metas','Trocas','educa','conquistas'];
  document.querySelectorAll('.nav-btn').forEach((b,i)=>b.classList.toggle('ativo',mapa[i]===nome));
  renderAba(nome);
}

// ============ TIPO DE CONTA (Aluno / Gestão) ============
function selecionarTipoCadastro(t){
  tipoCadastro=t;
  document.getElementById('campoCodigoGestao').classList.toggle('hidden',t!=='gestao');
}
function selecionarTipoLogin(t){
  tipoLoginSel=t;
}

// ---- Select personalizado (Aluno / Gestão) ----
function toggleSelectCustom(wrapId){
  document.querySelectorAll('.select-custom.aberto').forEach(el=>{ if(el.id!==wrapId) el.classList.remove('aberto'); });
  document.getElementById(wrapId).classList.toggle('aberto');
}
function selecionarSelectCustom(wrapId,value,label,optEl,callback){
  const wrap=document.getElementById(wrapId);
  wrap.querySelectorAll('.select-custom-opt').forEach(o=>o.classList.remove('ativo'));
  optEl.classList.add('ativo');
  wrap.querySelector('.select-custom-btn-left span').textContent=label;
  const iconeAlvo=wrap.querySelector('.select-custom-icon');
  const iconeOrigem=optEl.querySelector('svg');
  if(iconeAlvo&&iconeOrigem) iconeAlvo.innerHTML=iconeOrigem.innerHTML;
  wrap.classList.remove('aberto');
  if(callback) callback(value);
}
document.addEventListener('click', e=>{
  if(!e.target.closest('.select-custom')) document.querySelectorAll('.select-custom.aberto').forEach(el=>el.classList.remove('aberto'));
});
function isGestao(){
  return !!(logado && usuarios[logado] && usuarios[logado].tipo_usuario==='gestao');
}

// ============ AUTH ============
function emailFake(usuario){ return usuario.toLowerCase()+'@minerva.app'; }

async function cadastrar(){
  const u=document.getElementById('cadUsuario').value.trim().toUpperCase();
  const s=document.getElementById('cadSenha').value;
  if(!u||!s) return notif('Preencha todos os campos!','erro');
  if(s.length<6||s.length>24) return notif('Senha deve ter entre 6 e 24 caracteres','erro');

  let codigoGestao=null;
  if(tipoCadastro==='gestao'){
    codigoGestao=document.getElementById('cadCodigoGestao').value.trim().toUpperCase();
    if(!codigoGestao) return notif('Informe o código de autorização da Gestão!','erro');
    // Validação client-side de conveniência (best-effort). A validação real e definitiva
    // acontece no banco via trigger/tabela codigos_gestao — ver script SQL fornecido.
    if(!CODIGOS_GESTAO_FALLBACK.includes(codigoGestao)){
      // Não bloqueia aqui: deixa o Supabase decidir (caso a tabela codigos_gestao tenha outros códigos ativos).
      console.warn('Código não encontrado na lista local — validação final ficará a cargo do Supabase.');
    }
  }

  const { data, error } = await supabase.auth.signUp({ email: emailFake(u), password: s });
  if(error){
    console.error('Erro no signUp:', error);
    return notif(error.message==='User already registered'?'Usuário já existe!':error.message,'erro');
  }

  if(!data.session){
    console.error('Cadastro sem sessão ativa — confirmação de e-mail ainda ligada no Supabase.');
    return notif('Falta desativar "Confirm email" no Supabase (Authentication → Sign In / Providers → Email).','erro');
  }

  const { error: erroPerfil } = await supabase.from('perfis').insert({
    id: data.user.id, usuario: u, conta: gerarConta(),
    tipo_usuario: tipoCadastro
  });
  if(erroPerfil){
    console.error('Erro ao criar perfil:', erroPerfil);
    await supabase.auth.signOut();
    const msgCodigoInvalido = /c[oó]digo/i.test(erroPerfil.message);
    return notif(msgCodigoInvalido?'Código de autorização da Gestão inválido!':('Erro ao criar perfil: '+erroPerfil.message),'erro');
  }

  await supabase.auth.signOut();
  notif(tipoCadastro==='gestao'?'Conta de Gestão criada! Faça login.':'Conta criada! Faça login.');
  ir('telaLogin');
}

async function login(){
  const u=document.getElementById('loginUsuario').value.trim().toUpperCase();
  const s=document.getElementById('loginSenha').value;
  if(!u||!s) return notif('Preencha todos os campos!','erro');

  const { data, error } = await supabase.auth.signInWithPassword({ email: emailFake(u), password: s });
  if(error){
    console.error('Erro no login:', error);
    return notif(error.message==='Email not confirmed'?'Confirmação de e-mail ainda ativa no Supabase!':'Usuário ou senha incorretos!','erro');
  }

  await carregarPerfil(data.user.id, u);
  if(usuarios[u].bloqueado){ await supabase.auth.signOut(); return notif('Conta bloqueada!','erro'); }

  // Valida se o tipo de conta escolhido no login bate com o tipo cadastrado
  const tipoReal = usuarios[u].tipo_usuario || 'aluno';
  if(tipoReal!==tipoLoginSel){
    await supabase.auth.signOut();
    return notif(`Esta conta está cadastrada como ${tipoReal==='gestao'?'<i class="ph ph-briefcase"></i> Gestão':'<i class="ph ph-student"></i> Aluno'}. Selecione a opção correta para entrar.`,'erro');
  }

  logado=u;

  if(tipoReal==='gestao'){
    await abrirPainelGestao();
    return;
  }

  usuarios[u].educa=carregarEduca(u);
  document.getElementById('dashboard').classList.remove('hidden');
  ir('___');
  document.getElementById('sbAvatar').textContent=u.charAt(0);
  document.getElementById('sbNome').textContent=u;
  document.getElementById('sbConta').textContent='Conta: '+usuarios[u].conta;
  renderAba('financeiro');
  loopAtivo=true; loopGlobal(); atualizarOnline();
  notif(`Bem-vindo de volta, ${u}! <i class="ph ph-hand-waving"></i>`);
}

// Busca tudo do Supabase e monta o objeto local no mesmo formato de antes
async function carregarPerfil(userId, u){
  const [{data:perfil}, {data:trans}, {data:cart}, {data:metasDb}, {data:pix}] = await Promise.all([
    supabase.from('perfis').select('*').eq('id',userId).single(),
    supabase.from('transacoes').select('*').eq('user_id',userId).order('created_at'),
    supabase.from('carteira').select('*').eq('user_id',userId),
    supabase.from('metas').select('*').eq('user_id',userId),
    supabase.from('pix_mensagens').select('*').or(`de_usuario.eq.${u},para_usuario.eq.${u}`).order('created_at')
  ]);

  const carteiraObj={}; (cart||[]).forEach(c=>carteiraObj[c.ticker]=c.quantidade);

  usuarios[u]={
    id:userId,
    senha:'', conta:perfil.conta, saldo:Number(perfil.saldo),
    bloqueado:perfil.bloqueado,
    tipo_usuario:perfil.tipo_usuario||'aluno',
    turma:perfil.turma||null,
    historico:(trans||[]).map(t=>t.descricao),
    carteira:carteiraObj,
    metas:(metasDb||[]).map(m=>({id:m.id,nome:m.nome,valor:Number(m.valor),atual:Number(m.atual),concluida:m.concluida})),
    pixChat:(pix||[]).map(p=>({de:p.de_usuario,para:p.para_usuario,valor:fmt(p.valor),mensagem:p.mensagem,data:new Date(p.created_at).toLocaleTimeString('pt-BR'),tipo:p.tipo}))
  };
}

// Re-sincroniza o perfil do aluno logado com o Supabase (usado após alterações da Gestão)
async function atualizarMeuPerfil(){
  if(!logado||!usuarios[logado]) return;
  try{
    await carregarPerfil(usuarios[logado].id, logado);
    usuarios[logado].educa=carregarEduca(logado);
    notif('Saldo e extrato atualizados! <i class="ph ph-arrows-clockwise"></i>');
    renderAba('financeiro');
  }catch(e){
    console.error(e);
    notif('Não foi possível atualizar agora.','erro');
  }
}

async function logout(){
  await supabase.auth.signOut();
  logado=null; loopAtivo=false; gestaoAlunos=[]; gestaoAlunoAtual=null;
  if(pizzaChart){pizzaChart.destroy();pizzaChart=null;}
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('painelGestao').classList.add('hidden');
  ir('telaInicial');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('ativo'));
  document.querySelectorAll('#dashboard .nav-btn')[0]?.classList.add('ativo');
  document.querySelectorAll('#painelGestao .nav-btn')[0]?.classList.add('ativo');
}

function atualizarOnline(){
  const box=document.getElementById('sbOnline');
  if(!box||!logado) return;
  const nomes=Object.keys(usuarios);
  box.innerHTML=nomes.length?`<div class="titulo"><i class="ph ph-users"></i> Usuários</div>`+nomes.map(n=>`<div class="online-item"><div class="${n===logado?'dot-on':'dot-off'}"></div><span>${n}</span></div>`).join(''):'';
}

// ============ LOOP GLOBAL ============
function loopGlobal(){
  if(!loopAtivo||!logado) return;
  for(const t in mercado){
    const ant = mercado[t].preco;
    const d=(Math.random()-.5)*0.06;
    mercado[t].preco=Math.max(mercado[t].preco*(1+d),0.01);
    const novo = mercado[t].preco;

    // histórico para mini-gráfico
    historicoPrecos[t].push(novo);
    if(historicoPrecos[t].length>20) historicoPrecos[t].shift();

    // atualiza preço na bolsa com cor e flash
    const el=document.querySelector(`[data-ticker="${t}"]`);
    if(el){
      el.textContent=fmt(novo)+' pts';
      el.className='bolsa-preco '+(novo>=ant?'alta':'baixa');
      const row=el.closest('.bolsa-item');
      if(row){row.classList.remove('bolsa-flash');void row.offsetWidth;row.classList.add('bolsa-flash');}
    }

    // atualiza variação %
    const varEl=document.querySelector(`[data-var="${t}"]`);
    if(varEl){
      const pct=((novo-mercado[t].precoRef)/mercado[t].precoRef*100);
      const sinal=pct>=0?'+':'';
      varEl.className='bolsa-var';
      varEl.innerHTML=`<span class="${pct>=0?'var-pos':'var-neg'}">${sinal}${pct.toFixed(2)}%</span>`;
    }

    // atualiza mini canvas
    const cv=document.querySelector(`[data-mini="${t}"]`);
    if(cv) desenharMini(cv,historicoPrecos[t]);
  }

  // saldo no card financeiro
  const sv=document.querySelector('.saldo-valor');
  if(sv) sv.textContent=saldoVisivel?fmt(usuarios[logado].saldo)+' pts':'••••••••';

  setTimeout(loopGlobal,1000);
}

// mini gráfico de linha (canvas 2d simples)
function desenharMini(cv,dados){
  const ctx=cv.getContext('2d');
  const w=cv.width,h=cv.height;
  ctx.clearRect(0,0,w,h);
  if(dados.length<2) return;
  const min=Math.min(...dados), max=Math.max(...dados), range=max-min||1;
  const subindo=dados[dados.length-1]>=dados[0];
  ctx.strokeStyle=subindo?'#22c55e':'#ef4444';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  dados.forEach((v,i)=>{
    const x=(i/(dados.length-1))*w;
    const y=h-((v-min)/range)*(h-4)-2;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
}

// ============ RENDER ABAS ============
function renderAba(nome){
  const el=document.getElementById('mainConteudo');
  const d=usuarios[logado];
  if(pizzaChart){pizzaChart.destroy();pizzaChart=null;}

  if(nome==='financeiro'){
    el.innerHTML=`
      <div class="pg-header">
        <div><div class="pg-titulo">Olá, ${logado} <i class="ph ph-hand-waving"></i></div><div class="pg-sub">${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</div></div>
        <span class="badge badge-verde">● Conta ativa</span>
      </div>
      <div class="card-saldo">
        <div class="saldo-label">Pontos disponíveis <button class="btn-olho" onclick="toggleSaldo()"><i class="ph ph-eye"></i></button></div>
        <div class="saldo-valor">${fmt(d.saldo)} pts</div>
        <div class="saldo-conta">Conta ${d.conta} · Agência 0001</div>
        <div class="acoes">
          <div class="acao" onclick="abaNav('pix')"><span class="ai"><i class="ph ph-lightning"></i></span>PIX</div>
          <div class="acao" onclick="abaNav('Trocas')"><span class="ai"><i class="ph ph-gift"></i></span>Trocas</div>
          <div class="acao" onclick="atualizarMeuPerfil()"><span class="ai"><i class="ph ph-arrows-clockwise"></i></span>Atualizar</div>
        </div>
      </div>
      <div class="grid3" style="margin-bottom:22px">
        <div class="stat-box"><div class="sl">Conta</div><div class="sv" style="font-size:1.1rem">${d.conta}</div></div>
        <div class="stat-box"><div class="sl">Metas ativas</div><div class="sv">${d.metas.filter(m=>!m.concluida).length}</div></div>
        <div class="stat-box"><div class="sl">Minervas <i class="ph ph-graduation-cap"></i></div><div class="sv" style="color:var(--azul)">${(d.educa&&d.educa.minervas)||0} <i class="ph ph-coins"></i></div></div>
      </div>
      <div class="painel">
        <div class="painel-h"><i class="ph ph-clipboard-text"></i> Últimas movimentações <span style="font-size:.7rem;color:var(--azul);cursor:pointer;font-weight:400" onclick="abaNav('extrato')">ver tudo →</span></div>
        ${d.historico.length===0
          ?'<div style="color:var(--cinza);text-align:center;padding:30px">Nenhuma movimentação ainda.</div>'
          :d.historico.slice(-6).reverse().map(h=>renderExtItem(h)).join('')}
      </div>`;
  }

  else if(nome==='extrato'){
    // monta dados do gráfico de pizza a partir do histórico
    const cats = contarCategorias(d.historico);
    el.innerHTML=`
      <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-clipboard-text"></i> Extrato & Gastos</div><div class="pg-sub">Clique em qualquer transação para ver o comprovante</div></div></div>
      <div class="pizza-wrap">
        <div class="painel" style="grid-column:1">
          <div class="painel-h">Todas as movimentações</div>
          ${d.historico.length===0
            ?'<div style="color:var(--cinza);text-align:center;padding:40px">Nenhuma movimentação ainda.</div>'
            :[...d.historico].reverse().map(h=>renderExtItem(h,true)).join('')}
        </div>
        <div>
          <div class="pizza-canvas-wrap">
            <div class="painel-h" style="margin-bottom:10px"><i class="ph ph-pizza"></i> Gastos por categoria</div>
            ${cats.total>0
              ?`<canvas id="pizzaCanvas" width="200" height="200"></canvas>
                <div class="pizza-legenda" id="pizzaLegenda"></div>`
              :`<div class="pizza-vazio">Faça transações para ver<br>o gráfico de gastos aparecer aqui.</div>`}
          </div>
        </div>
      </div>`;
    if(cats.total>0) setTimeout(()=>renderPizza(cats),50);
  }

  else if(nome==='pix'){
    const msgs=d.pixChat||[];
    el.innerHTML=`
      <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-lightning"></i> PIX ao Vivo</div><div class="pg-sub">Transferências instantâneas entre usuários</div></div></div>
      <div class="pix-wrap">
        <div>
          <div class="pix-chave-box"><div class="lbl">Sua chave PIX</div><div class="chave">${logado}</div></div>
          <div class="pix-saldo-box"><div class="lbl">Pontos disponíveis</div><div class="val">${fmt(d.saldo)} pts</div></div>
          <div class="painel pix-form">
            <div class="painel-h">Enviar / Pedir PIX</div>
            <div class="form-group"><label>Usuário destino</label><input id="pixDestino" type="text" placeholder="Nome do usuário"></div>
            <div class="form-group"><label>Valor</label><input id="pixValor" type="text" placeholder="0,00"></div>
            <div class="form-group"><label>Mensagem (opcional)</label><input id="pixMensagem" type="text" placeholder="Ex: Almoço, obrigado!"></div>
            <div class="pix-btns">
              <button class="btn-pix-enviar" onclick="enviarPix()"><i class="ph ph-lightning"></i> Enviar PIX</button>
              <button class="btn-pix-pedir" onclick="pedirPix()"><i class="ph ph-device-mobile"></i> Pedir PIX</button>
            </div>
          </div>
        </div>
        <div class="painel chat-wrap">
          <div class="painel-h"><i class="ph ph-chat-circle-dots"></i> Chat PIX ao vivo</div>
          <div class="chat-msgs" id="chatPix">
            ${msgs.length===0
              ?'<div style="color:var(--cinza);text-align:center;padding:30px;font-size:.9rem">Nenhuma mensagem ainda.</div>'
              :msgs.slice(-20).map(m=>`
                <div class="msg msg-${m.tipo==='chat-enviado'?'env':m.tipo==='chat-recebido'?'rec':'ped'}">
                  <div><span class="msg-de">${m.de}</span> → <span class="msg-val">${m.valor} pts</span></div>
                  <div class="msg-txt">${m.mensagem}</div>
                  <div class="msg-hora">${m.data}</div>
                </div>`).join('')}
          </div>
        </div>
      </div>`;
    setTimeout(()=>{const c=document.getElementById('chatPix');if(c)c.scrollTop=c.scrollHeight;},50);
  }

  else if(nome==='metas'){
    el.innerHTML=`
      <div class="pg-header"><div class="pg-titulo"><i class="ph ph-target"></i> Minhas Metas</div></div>
      <div style="max-width:700px">
        ${d.metas.length===0
          ?'<div style="color:var(--cinza);text-align:center;padding:40px">Nenhuma meta criada ainda.</div>'
          :d.metas.map((m,i)=>{
            const p=Math.min((m.atual/m.valor)*100,100);
            return `<div class="meta-card">
              <div class="meta-nome">${m.nome}</div>
              <div class="meta-vals"><span>${fmt(m.atual)}</span> / <span>${fmt(m.valor)}</span> pts</div>
              <div class="progress"><div class="progress-fill" style="width:${p}%"></div></div>
              ${m.concluida?'<div class="meta-ok"><i class="ph ph-check-circle"></i> Concluída!</div>'
                :`<button style="margin-top:10px;padding:8px 18px;border:1px solid var(--azul);background:transparent;color:var(--azul);border-radius:9px;cursor:pointer;font-size:.82rem;font-weight:600" onclick="modalAporte(${i})">+ Aportar</button>`}
            </div>`;
          }).join('')}
        <button class="btn-nova-meta" onclick="modalNovaMeta()">+ Nova Meta</button>
      </div>`;
  }

  else if(nome==='Trocas'){
    el.innerHTML=`
      <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-gift"></i> Trocas</div><div class="pg-sub">Troque seus pontos por prêmios</div></div></div>
      <div class="bolsa-grid">
        ${premios.map(p=>{
          const pode=d.saldo>=p.valor;
          return `<div class="bolsa-item">
            <div class="bolsa-ticker-badge">${p.icone}</div>
            <div class="bolsa-info">
              <div class="bolsa-ticker">${p.nome}</div>
              <div class="bolsa-nome">${p.desc}</div>
            </div>
            <div class="bolsa-preco-wrap">
              <div class="bolsa-preco alta">${fmt(p.valor)} pts</div>
            </div>
            <div class="bolsa-acoes-wrap">
              <button class="btn-compra" ${pode?'':'disabled style="opacity:.5;cursor:not-allowed"'} onclick="modalTroca('${p.nome}')">Trocar</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  else if(nome==='educa') renderEduca();
  else if(nome==='conquistas') renderConquistas();
  else if(nome==='copa') renderCopaAluno();
  else if(nome==='config') renderConfigAluno();
}

// ---------- Configurações (Aluno) ----------
function renderConfigAluno(){
  const el=document.getElementById('mainConteudo');
  const claro=document.body.classList.contains('tema-claro');
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-gear"></i> Configurações</div><div class="pg-sub">Preferências da sua conta</div></div></div>
    <div class="painel" style="max-width:520px;margin-bottom:20px">
      <div class="painel-h">Conta</div>
      <div class="ext-item"><div class="ext-ic ic-n"><i class="ph ph-student"></i></div><div class="ext-info"><div class="ext-desc">${logado}</div><div class="ext-data">Tipo de usuário: Aluno · Conta ${usuarios[logado]?.conta||''}</div></div></div>
    </div>
    <div class="painel" style="max-width:520px;margin-bottom:20px">
      <div class="painel-h"><i class="ph ph-palette"></i> Tema</div>
      <div class="tipo-conta-btns">
        <button type="button" class="tipo-conta-btn ${!claro?'ativo':''}" onclick="aplicarTema('escuro'), renderConfigAluno()"><i class="ph ph-moon"></i> Preto (original)</button>
        <button type="button" class="tipo-conta-btn ${claro?'ativo':''}" onclick="aplicarTema('claro'), renderConfigAluno()"><i class="ph ph-sun"></i> Branco</button>
      </div>
    </div>
    <div class="painel" style="max-width:520px">
      <div class="painel-h">Sessão</div>
      <button class="btn-form" style="background:rgba(239,68,68,.15);color:#fca5a5" onclick="logout()">↩ Sair da conta</button>
    </div>`;
}

// ============ EXTRATO ITEM ============
function renderExtItem(h, clicavel=false){
  const pos=h.includes('ADICIONADO')||h.includes('PIX RECEBIDO')||h.includes('VENDA');
  const hora=h.match(/\[(.*?)\]/)?.[1]||'';
  const desc=h.replace(/\[.*?\]\s*/,'');
  const onclick=clicavel?`onclick="verComprovante('${encodeURIComponent(h)}')"` :'';
  return `<div class="ext-item" ${onclick}>
    <div class="ext-ic ${pos?'ic-e':'ic-s'}">${pos?'⬆️':'⬇️'}</div>
    <div class="ext-info"><div class="ext-desc">${desc}</div><div class="ext-data">${hora}</div></div>
    ${clicavel?'<span class="ext-ver">ver comprovante</span>':''}
  </div>`;
}

// ============ COMPROVANTE ============
function verComprovante(hEnc){
  const h=decodeURIComponent(hEnc);
  const pos=h.includes('ADICIONADO')||h.includes('PIX RECEBIDO')||h.includes('VENDA');
  const hora=h.match(/\[(.*?)\]/)?.[1]||hora();
  const desc=h.replace(/\[.*?\]\s*/,'');

  // extrai valor
  const mVal=h.match(/([\d.,]+)\s*pts/);
  const valorStr=mVal?mVal[1]+' pts':'—';

  // tipo bonito
  let tipo='Movimentação', icone='<i class="ph ph-currency-circle-dollar"></i>';
  if(h.includes('PIX ENVIADO')){ tipo='PIX Enviado'; icone='<i class="ph ph-lightning"></i>';}
  else if(h.includes('PIX RECEBIDO')){ tipo='PIX Recebido'; icone='<i class="ph ph-lightning"></i>';}
  else if(h.includes('ADICIONADO')){ tipo='Depósito'; icone='<i class="ph ph-plus"></i>';}
  else if(h.includes('SAQUE')){ tipo='Saque'; icone='<i class="ph ph-minus"></i>';}
  else if(h.includes('COMPRA')){ tipo='Compra de Ativo'; icone='<i class="ph ph-chart-line-up"></i>';}
  else if(h.includes('VENDA')){ tipo='Venda de Ativo'; icone='<i class="ph ph-chart-bar"></i>';}
  else if(h.includes('APORTE')){ tipo='Aporte em Meta'; icone='<i class="ph ph-target"></i>';}

  const auth=gerarAuth();
  const data=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});

  const corpo=`
    <div class="comprovante">
      <div class="comp-logo"><span>MINERVA</span><p>Rewards System</p></div>
      <div class="comp-status">
        <div class="comp-check">${icone}</div>
        <h4>Transação realizada</h4>
      </div>
      <div class="comp-valor-big">${valorStr}</div>
      <div class="comp-tipo">${tipo}</div>
      <div class="comp-linha"><span class="cl">Descrição</span><span class="cv">${desc}</span></div>
      <div class="comp-linha"><span class="cl">Horário</span><span class="cv">${hora}</span></div>
      <div class="comp-linha"><span class="cl">Data</span><span class="cv">${data}</span></div>
      <div class="comp-linha"><span class="cl">Conta origem</span><span class="cv">${logado} · ${usuarios[logado].conta}</span></div>
      <div class="comp-linha"><span class="cl">Agência</span><span class="cv">0001 · Minerva Digital</span></div>
      <div class="comp-linha"><span class="cl">Tipo</span><span class="cv">${pos?'Crédito':'Débito'}</span></div>
      <div class="comp-codigo"><small>Código de autenticação</small>${auth}-${Date.now().toString(36).toUpperCase()}</div>
      <button class="btn-imprimir" onclick="window.print()"><i class="ph ph-printer"></i> Imprimir / Salvar PDF</button>
      <button class="btn-cancelar" style="width:100%;margin-top:12px" onclick="fecharModal()">← Fechar</button>
    </div>`;

  modal('',corpo,null,true);
}

// ============ GRÁFICO DE PIZZA ============
function contarCategorias(historico){
  const cats={};
  let total=0;
  historico.forEach(h=>{
    const saida=!h.includes('ADICIONADO')&&!h.includes('PIX RECEBIDO')&&!h.includes('VENDA');
    if(!saida) return;
    const mVal=h.match(/([\d.,]+)\s*pts/);
    if(!mVal) return;
    const v=parseFloat(mVal[1].replace(/\./g,'').replace(',','.'));
    if(isNaN(v)||v<=0) return;
    let cat='Outros';
    if(h.includes('PIX')) cat='PIX Enviado';
    else if(h.includes('SAQUE')) cat='Saques';
    else if(h.includes('COMPRA')) cat='Trocas';
    else if(h.includes('APORTE')) cat='Metas';
    cats[cat]=(cats[cat]||0)+v;
    total+=v;
  });
  return {cats,total};
}

function renderPizza({cats}){
  const cv=document.getElementById('pizzaCanvas');
  if(!cv) return;
  const cores=['#00B4D8','#22c55e','#a855f7','#f59e0b','#ef4444','#90E0EF'];
  const labels=Object.keys(cats);
  const vals=Object.values(cats);
  const totalV=vals.reduce((a,b)=>a+b,0);

  if(pizzaChart) pizzaChart.destroy();
  pizzaChart=new Chart(cv,{
    type:'doughnut',
    data:{
      labels,
      datasets:[{data:vals,backgroundColor:cores.slice(0,labels.length),borderColor:'transparent',borderWidth:0,hoverOffset:8}]
    },
    options:{
      cutout:'65%',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${fmt(ctx.raw)} pts (${((ctx.raw/totalV)*100).toFixed(1)}%)`}}},
      animation:{duration:800}
    }
  });

  const leg=document.getElementById('pizzaLegenda');
  if(leg){
    leg.innerHTML=labels.map((l,i)=>`
      <div class="pizza-leg-item">
        <div class="pizza-dot" style="background:${cores[i]}"></div>
        <div class="pizza-leg-nome">${l}</div>
        <div class="pizza-leg-val">${fmt(vals[i])} pts</div>
        <div class="pizza-leg-pct">${((vals[i]/totalV)*100).toFixed(1)}%</div>
      </div>`).join('');
  }
}

// ============ TOGGLE SALDO ============
function toggleSaldo(){
  saldoVisivel=!saldoVisivel;
  const sv=document.querySelector('.saldo-valor');
  if(sv) sv.textContent=saldoVisivel?fmt(usuarios[logado].saldo)+' pts':'••••••••';
}

// ============ PIX ============
function enviarPix(){
  const dest=document.getElementById('pixDestino').value.trim().toUpperCase();
  const valS=document.getElementById('pixValor').value.trim();
  const msg=document.getElementById('pixMensagem').value.trim()||'PIX enviado';
  if(!dest||!valS) return notif('Preencha destino e valor!','erro');
  if(!usuarios[dest]) return notif('Usuário não encontrado!','erro');
  if(dest===logado) return notif('Não pode enviar para si mesmo!','erro');
  const v=parseValor(valS);
  if(isNaN(v)||v<=0) return notif('Valor inválido!','erro');
  if(v>usuarios[logado].saldo) return notif('Pontos insuficientes!','erro');
  usuarios[logado].saldo-=v;
  usuarios[dest].saldo+=v;
  const agora=hora();
  const reg=`[${agora}] PIX ENVIADO para ${dest}: -${fmt(v)} pts`;
  usuarios[logado].historico.push(reg);
  usuarios[dest].historico.push(`[${agora}] PIX RECEBIDO de ${logado}: +${fmt(v)} pts`);
  const mc={de:logado,para:dest,valor:fmt(v),mensagem:msg,data:agora};
  usuarios[logado].pixChat.push({...mc,tipo:'chat-enviado'});
  usuarios[dest].pixChat.push({...mc,tipo:'chat-recebido'});
  salvar();
  notif(`<i class="ph ph-lightning"></i> PIX de ${fmt(v)} pts enviado para ${dest}!`);
  renderAba('pix');
  setTimeout(()=>verComprovante(encodeURIComponent(reg)),600);
}

function pedirPix(){
  const dest=document.getElementById('pixDestino').value.trim().toUpperCase();
  const valS=document.getElementById('pixValor').value.trim();
  const msg=document.getElementById('pixMensagem').value.trim()||'Me manda um PIX!';
  if(!dest||!valS) return notif('Preencha destino e valor!','erro');
  if(!usuarios[dest]) return notif('Usuário não encontrado!','erro');
  const v=parseValor(valS);
  if(isNaN(v)||v<=0) return notif('Valor inválido!','erro');
  const agora=hora();
  const mc={de:logado,para:dest,valor:fmt(v),mensagem:`<i class="ph ph-device-mobile"></i> PEDIDO: ${msg}`,data:agora,tipo:'chat-pedido'};
  usuarios[logado].pixChat.push(mc);
  usuarios[dest].pixChat.push(mc);
  usuarios[dest].historico.push(`[${agora}] ${logado} PEDIU PIX: ${fmt(v)} pts | ${msg}`);
  salvar();
  notif(`<i class="ph ph-device-mobile"></i> Pedido de ${fmt(v)} pts enviado para ${dest}!`,'info');
  renderAba('pix');
}

// ============ METAS ============
function modalNovaMeta(){
  modal('Nova Meta',
    `<label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Nome</label>
     <input id="mNome" class="inp" type="text" placeholder="Ex: Viagem, Carro..." style="margin-bottom:14px">
     <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Valor alvo (pontos)</label>
     <input id="mValor" class="inp" type="text" placeholder="0,00" style="margin-bottom:0">`,
    ()=>{
      const nome=document.getElementById('mNome').value.trim();
      const v=parseValor(document.getElementById('mValor').value);
      if(!nome||isNaN(v)||v<=0) return notif('Dados inválidos!','erro');
      usuarios[logado].metas.push({nome,valor:v,atual:0,concluida:false});
      salvar(); fecharModal(); renderAba('metas'); notif('Meta criada!');
    });
}

function modalAporte(i){
  const meta=usuarios[logado].metas[i];
  modal(`Aportar: ${meta.nome}`,
    `<label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Valor (pontos)</label>
     <input id="mInp" class="inp" type="text" placeholder="0,00" style="margin-bottom:0">`,
    ()=>{
      const v=parseValor(document.getElementById('mInp').value);
      if(isNaN(v)||v<=0) return notif('Valor inválido!','erro');
      if(v>usuarios[logado].saldo) return notif('Pontos insuficientes!','erro');
      usuarios[logado].saldo-=v;
      usuarios[logado].metas[i].atual+=v;
      if(usuarios[logado].metas[i].atual>=usuarios[logado].metas[i].valor){usuarios[logado].metas[i].concluida=true;notif('<i class="ph ph-confetti"></i> Meta concluída!');}
      else notif(`Aporte de ${fmt(v)} pts realizado!`);
      const reg=`[${hora()}] APORTE META '${meta.nome}': -${fmt(v)} pts`;
      usuarios[logado].historico.push(reg);
      salvar(); fecharModal(); renderAba('metas');
    });
}

// ============ TROCAS ============
function modalTroca(nomePremio){
  const p=premios.find(x=>x.nome===nomePremio);
  if(!p) return;
  modal(`Trocar por ${p.nome}`,
    `<div style="color:var(--cinza);font-size:.85rem;margin-bottom:14px">${p.desc}</div>
     <div style="color:var(--cinza);font-size:.85rem;margin-bottom:4px">Custo do resgate:</div>
     <div style="font-size:1.4rem;font-weight:700;color:var(--verde);margin-bottom:14px">${fmt(p.valor)} pts</div>
     <div style="font-size:.82rem;color:var(--cinza)">Confirma o resgate deste prêmio?</div>`,
    ()=>{
      if(p.valor>usuarios[logado].saldo) return notif('Pontos insuficientes!','erro');
      usuarios[logado].saldo-=p.valor;
      const reg=`[${hora()}] TROCA ${p.nome}: -${fmt(p.valor)} pts`;
      usuarios[logado].historico.push(reg);
      salvar(); fecharModal(); renderAba('Trocas');
      notif(`${p.nome} resgatado com sucesso!`);
      setTimeout(()=>verComprovante(encodeURIComponent(reg)),400);
      // Sincronização adicional (não bloqueante) com o Supabase, para que a Gestão
      // consiga visualizar o resgate no painel administrativo. Não altera o fluxo local.
      try{
        supabase.from('transacoes').insert({user_id:usuarios[logado].id, descricao:reg}).then(()=>{});
        supabase.from('perfis').update({saldo:usuarios[logado].saldo}).eq('id',usuarios[logado].id).then(()=>{});
      }catch(e){ console.warn('Sync Supabase (Trocas) falhou — não crítico:',e); }
    });
}

// ============ MINERVA EDUCA ============
function renderEduca(){
  const el=document.getElementById('mainConteudo');
  const d=usuarios[logado];
  const ed=d.educa;
  const totalAtividades=educaModulos.length+1;
  const feitas=(ed.atividadesConcluidas||[]).length;
  const nivel=Math.floor(ed.xp/100)+1;
  const xpNivelAtual=ed.xp%100;
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-graduation-cap"></i> Minerva Educa</div><div class="pg-sub">Aprenda a cuidar do seu dinheiro jogando e testando seus conhecimentos</div></div></div>
    <div class="educa-grid">
      <div class="educa-header" onclick="abrirEducaModulos()">
        <div class="educa-xp-label">MINERVA EDUCA</div>
        <div class="educa-xp-valor">Nível ${nivel}</div>
        <div style="font-size:.82rem;color:var(--cinza);margin-top:6px;position:relative;z-index:1">Clique para ver módulos, quizzes e desafios <span class="educa-toggle-seta" id="educaSeta">▼</span></div>
        <div class="educa-progress-wrap">
          <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--cinza)"><span>${xpNivelAtual} XP</span><span>100 XP</span></div>
          <div class="educa-progress-bar"><div class="educa-progress-fill" style="width:${xpNivelAtual}%"></div></div>
        </div>
        <div class="grid3" style="margin-top:22px;position:relative;z-index:1">
          <div class="stat-box"><div class="sl">XP Total</div><div class="sv">${ed.xp}</div></div>
          <div class="stat-box"><div class="sl">Minervas</div><div class="sv" style="color:var(--azul)">${ed.minervas} <i class="ph ph-coins"></i></div></div>
          <div class="stat-box"><div class="sl">Atividades</div><div class="sv">${feitas}/${totalAtividades}</div></div>
        </div>
      </div>
      <div class="educa-em-breve">
        <div style="font-size:2rem"><i class="ph ph-film-strip"></i></div>
        <div style="font-weight:700;color:var(--gelo)">${educaModulos.length} módulos · ${educaVideos.length} vídeo-aulas</div>
        <div>Aulas em texto, quizzes e vídeos sobre educação financeira, tudo em um só lugar.</div>
      </div>
    </div>
    <div id="educaModulos" class="educa-collapse">
     <div class="educa-collapse-inner">
      <div class="painel-h" style="margin-bottom:14px"><i class="ph ph-books"></i> Módulos de Educação Financeira</div>
      <div class="educa-mod-grid">
        ${educaModulos.map(m=>{
          const feito=(ed.atividadesConcluidas||[]).includes(m.id);
          return `<div class="mod-card ${feito?'concluido':''}" onclick="abrirModulo('${m.id}')">
            <div class="mod-ic">${m.icone}</div>
            <div class="mod-titulo">${m.titulo}</div>
            <div class="mod-desc">${m.desc}</div>
            <span class="mod-tag ${feito?'feito':'pendente'}">${feito?'<i class="ph ph-check"></i> Concluído':'Iniciar quiz'}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="jogo-card">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
          <div style="font-size:1.8rem">${educaSituacao.icone}</div>
          <div><div class="mod-titulo">${educaSituacao.titulo}</div><div class="mod-desc" style="min-height:auto;margin-bottom:0">${educaSituacao.desc}</div></div>
        </div>
        <button class="btn-form btn-azul" style="max-width:260px;margin-top:0" onclick="abrirSituacao()">${(ed.atividadesConcluidas||[]).includes(educaSituacao.id)?'<i class="ph ph-check"></i> Jogar novamente':'▶ Jogar agora'}</button>
      </div>
      <div class="painel-h" style="margin:26px 0 14px"><i class="ph ph-film-strip"></i> Vídeo-aulas</div>
      <div class="educa-video-grid">
        ${educaVideos.map(v=>`<div class="video-card" onclick="abrirVideo('${v.id}','${v.titulo.replace(/'/g,"\\'")}')">
          <div class="video-thumb"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${v.titulo}"><div class="video-play">▶️</div></div>
          <div class="video-info"><div class="video-titulo">${v.titulo}</div><div class="video-fonte">${v.fonte}</div></div>
        </div>`).join('')}
      </div>
     </div>
    </div>`;
}

function abrirVideo(id,titulo){
  modal(`<i class="ph ph-film-strip"></i> ${titulo}`,
    `<div class="mod-video-wrap"><iframe src="https://www.youtube.com/embed/${id}" title="${titulo}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>
     <button class="btn-cancelar" style="width:100%;margin-top:4px" onclick="fecharModal()">Fechar</button>`,
    null, true);
}

function abrirEducaModulos(){
  const box=document.getElementById('educaModulos');
  const seta=document.getElementById('educaSeta');
  if(!box) return;
  const aberta=box.classList.toggle('aberta');
  if(seta) seta.classList.toggle('girada',aberta);
}

// ------ Aula + Quiz dos módulos ------
function abrirModulo(id){
  const m=educaModulos.find(x=>x.id===id);
  if(!m) return;
  if(m.conteudo){
    modal(`${m.icone} ${m.titulo}`,
      `<div class="mod-conteudo">${m.conteudo}</div>
       <button class="btn-form btn-azul" style="margin-top:0" onclick="iniciarQuizModulo('${m.id}')">Iniciar quiz →</button>
       <button class="btn-cancelar" style="width:100%;margin-top:10px" onclick="fecharModal()">← Sair</button>`,
      null, true);
  }else{
    iniciarQuizModulo(id);
  }
}

function iniciarQuizModulo(id){
  const m=educaModulos.find(x=>x.id===id);
  if(!m) return;
  const renderPergunta=()=>{
    const p=m.perguntas[window._quizState.atual];
    modal(`${m.icone} ${m.titulo} (${window._quizState.atual+1}/${m.perguntas.length})`,
      `<div style="color:var(--cinza);font-size:.88rem;margin-bottom:16px">${p.q}</div>
       <div style="display:flex;flex-direction:column;gap:10px">
         ${p.opcoes.map((o,i)=>`<button class="btn-form btn-ghost" style="text-align:left;margin-top:0" onclick="responderQuiz('${m.id}',${i})">${o}</button>`).join('')}
       </div>
       <button class="btn-cancelar" style="width:100%;margin-top:14px" onclick="fecharModal()">← Sair</button>`,
      null, true);
  };
  window._quizState={m,atual:0,acertos:0,renderPergunta};
  renderPergunta();
}

function responderQuiz(modId,indice){
  const st=window._quizState;
  if(!st||st.m.id!==modId) return;
  const p=st.m.perguntas[st.atual];
  const certo=indice===p.certa;
  if(certo) st.acertos++;
  notif(certo?'<i class="ph ph-check-circle"></i> Resposta correta!':'<i class="ph ph-x-circle"></i> Resposta incorreta, mas continue tentando!', certo?'ok':'erro');
  st.atual++;
  if(st.atual<st.m.perguntas.length){
    setTimeout(()=>st.renderPergunta(),500);
  }else{
    setTimeout(()=>concluirAtividade(st.m.id, st.m.titulo, `Acertos: ${st.acertos}/${st.m.perguntas.length}`),500);
  }
}

// ------ Situação / jogo de decisões ------
function abrirSituacao(){
  const renderCena=()=>{
    const c=educaSituacao.cenas[window._situacaoState.cena];
    modal(`${educaSituacao.icone} ${educaSituacao.titulo} (${window._situacaoState.cena+1}/${educaSituacao.cenas.length})`,
      `<div style="color:var(--cinza);font-size:.88rem;margin-bottom:16px">${c.texto}</div>
       <div style="display:flex;flex-direction:column;gap:10px">
         ${c.opcoes.map((o,i)=>`<button class="btn-form btn-ghost" style="text-align:left;margin-top:0" onclick="responderSituacao(${i})">${o.texto}</button>`).join('')}
       </div>
       <button class="btn-cancelar" style="width:100%;margin-top:14px" onclick="fecharModal()">← Sair</button>`,
      null, true);
  };
  window._situacaoState={cena:0,renderCena};
  renderCena();
}

function responderSituacao(indice){
  const st=window._situacaoState;
  if(!st) return;
  const c=educaSituacao.cenas[st.cena];
  const escolha=c.opcoes[indice];
  const ultima=st.cena+1>=educaSituacao.cenas.length;
  modal(`${educaSituacao.icone} ${educaSituacao.titulo}`,
    `<div style="color:var(--gelo);font-size:.9rem;margin-bottom:6px">${escolha.feedback}</div>`,
    ()=>{
      st.cena++;
      if(st.cena<educaSituacao.cenas.length) st.renderCena();
      else concluirAtividade(educaSituacao.id, educaSituacao.titulo);
    });
  document.getElementById('modalConfirmar').textContent=ultima?'Finalizar':'Continuar →';
}

// ------ Conclusão de atividades (recompensa em XP + Minervas) ------
function concluirAtividade(id,titulo,detalhe){
  const ed=usuarios[logado].educa;
  ed.atividadesConcluidas=ed.atividadesConcluidas||[];
  const jaFeita=ed.atividadesConcluidas.includes(id);
  if(!jaFeita){
    ed.atividadesConcluidas.push(id);
    ed.xp+=30; ed.minervas+=20;
    salvarEduca();
  }
  fecharModal();
  const novas=verificarConquistas();
  notif(`<i class="ph ph-confetti"></i> ${titulo} concluído!${detalhe?' '+detalhe:''}${jaFeita?'':' | +30 XP +20 Minervas'}`);
  novas.forEach((c,i)=>setTimeout(()=>notif(`<i class="ph ph-trophy"></i> Conquista desbloqueada: ${c.titulo}!`,'info'),700+i*600));
  renderAba('educa');
}

// ============ CONQUISTAS ============
function verificarConquistas(){
  const d=usuarios[logado];
  const ed=d.educa;
  ed.conquistasVistas=ed.conquistasVistas||[];
  const novas=[];
  conquistasDef.forEach(c=>{
    if(c.check(d)&&!ed.conquistasVistas.includes(c.id)){
      ed.conquistasVistas.push(c.id);
      novas.push(c);
    }
  });
  if(novas.length) salvarEduca();
  return novas;
}

function renderConquistas(){
  const el=document.getElementById('mainConteudo');
  const d=usuarios[logado];
  verificarConquistas();
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-trophy"></i> Conquistas</div><div class="pg-sub">Objetivos que você já alcançou no Minerva</div></div></div>
    <div class="conquista-grid">
      ${conquistasDef.map(c=>{
        const ok=c.check(d);
        return `<div class="conquista-card ${ok?'desbloqueada':'bloqueada'}">
          ${ok?'':'<div class="conquista-cadeado"><i class="ph ph-lock"></i></div>'}
          <div class="conquista-ic">${ok?c.icone:'<i class="ph ph-lock"></i>'}</div>
          <div class="conquista-titulo">${c.titulo}</div>
          <div class="conquista-desc">${c.desc}</div>
          <span class="conquista-status ${ok?'ok':'no'}">${ok?'Desbloqueada':'Bloqueada'}</span>
        </div>`;
      }).join('')}
    </div>`;
}

// ============================================================
// ============ PAINEL DE GESTÃO (ADMINISTRATIVO) ============
// ============================================================

async function abrirPainelGestao(){
  document.getElementById('painelGestao').classList.remove('hidden');
  ir('___');
  document.getElementById('gsAvatar').textContent=logado.charAt(0);
  document.getElementById('gsNome').textContent=logado;
  document.querySelectorAll('#painelGestao .nav-btn').forEach((b,i)=>b.classList.toggle('ativo',i===0));
  await renderGestaoAba('dashboard');
  notif(`Bem-vindo, ${logado}! Painel de Gestão <i class="ph ph-briefcase"></i>`);
}

function abaGestao(btn,nome){
  document.querySelectorAll('#painelGestao .nav-btn').forEach(b=>b.classList.remove('ativo'));
  btn.classList.add('ativo');
  renderGestaoAba(nome);
}

async function renderGestaoAba(nome){
  if(!isGestao()){ notif('Acesso restrito à Gestão!','erro'); return; }
  if(nome==='dashboard') return renderGestaoDashboard();
  if(nome==='alunos') return renderGestaoAlunos();
  if(nome==='pontos') return renderGestaoPontos();
  if(nome==='recompensas') return renderGestaoRecompensas();
  if(nome==='copa') return renderGestaoCopa();
  if(nome==='historico') return renderGestaoHistorico();
  if(nome==='relatorios') return renderGestaoRelatorios();
  if(nome==='config') return renderGestaoConfig();
}

// ---------- Dados ----------
async function carregarAlunosGestao(){
  const {data,error}=await supabase.from('perfis').select('*').eq('tipo_usuario','aluno').order('usuario');
  if(error){ console.error(error); notif('Erro ao carregar alunos: '+error.message,'erro'); return []; }
  return data||[];
}

async function carregarStatsGestao(){
  const [{data:alunos},{data:movs},{data:trocas}]=await Promise.all([
    supabase.from('perfis').select('id,bloqueado').eq('tipo_usuario','aluno'),
    supabase.from('movimentacoes_pontos').select('tipo,quantidade'),
    supabase.from('transacoes').select('id').ilike('descricao','%TROCA%')
  ]);
  const totalAlunos=(alunos||[]).length;
  const alunosAtivos=(alunos||[]).filter(a=>!a.bloqueado).length;
  const totalAdicionado=(movs||[]).filter(m=>m.tipo==='adicao').reduce((s,m)=>s+Number(m.quantidade),0);
  const totalRemovido=(movs||[]).filter(m=>m.tipo==='remocao').reduce((s,m)=>s+Number(m.quantidade),0);
  const totalTrocas=(trocas||[]).length;
  return {totalAlunos,alunosAtivos,totalAdicionado,totalRemovido,totalTrocas};
}

async function carregarAtividadesRecentes(limit=8){
  const {data,error}=await supabase.from('movimentacoes_pontos')
    .select('*, aluno:aluno_id(usuario), gestao:gestao_id(usuario)')
    .order('created_at',{ascending:false}).limit(limit);
  if(error){ console.error(error); return []; }
  return data||[];
}

// ---------- Dashboard ----------
async function renderGestaoDashboard(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML=`
    <div class="pg-header">
      <div><div class="pg-titulo">Painel de Gestão <i class="ph ph-briefcase"></i></div><div class="pg-sub">Visão geral do MINERVA Rewards System</div></div>
      <span class="badge badge-gestao">● Gestão ativa</span>
    </div>
    <div style="text-align:center;color:var(--cinza);padding:30px">Carregando dados...</div>`;

  const [stats,atividades]=await Promise.all([carregarStatsGestao(),carregarAtividadesRecentes()]);

  el.innerHTML=`
    <div class="pg-header">
      <div><div class="pg-titulo">Painel de Gestão <i class="ph ph-briefcase"></i></div><div class="pg-sub">Visão geral do MINERVA Rewards System</div></div>
      <span class="badge badge-gestao">● Gestão ativa</span>
    </div>
    <div class="grid3" style="margin-bottom:20px">
      <div class="stat-box"><div class="sl"><i class="ph ph-student"></i> Total de alunos</div><div class="sv">${stats.totalAlunos}</div></div>
      <div class="stat-box"><div class="sl"><i class="ph ph-check-circle"></i> Alunos ativos</div><div class="sv">${stats.alunosAtivos}</div></div>
      <div class="stat-box"><div class="sl"><i class="ph ph-gift"></i> Recompensas resgatadas</div><div class="sv">${stats.totalTrocas}</div></div>
    </div>
    <div class="grid2" style="margin-bottom:22px">
      <div class="stat-box"><div class="sl">⭐ Pontos distribuídos</div><div class="sv" style="color:var(--verde)">+${fmt(stats.totalAdicionado)}</div></div>
      <div class="stat-box"><div class="sl"><i class="ph ph-minus"></i> Pontos removidos</div><div class="sv" style="color:var(--vermelho)">-${fmt(stats.totalRemovido)}</div></div>
    </div>
    <div class="painel">
      <div class="painel-h"><i class="ph ph-clipboard-text"></i> Atividades recentes</div>
      ${atividades.length===0
        ?'<div style="color:var(--cinza);text-align:center;padding:30px">Nenhuma atividade administrativa registrada ainda.</div>'
        :atividades.map(a=>`
          <div class="ext-item">
            <div class="ext-ic ${a.tipo==='adicao'?'ic-e':'ic-s'}">${a.tipo==='adicao'?'⬆️':'⬇️'}</div>
            <div class="ext-info">
              <div class="ext-desc">${a.aluno?.usuario||'—'} ${a.tipo==='adicao'?'+':'-'}${fmt(a.quantidade)} pts — ${a.motivo}</div>
              <div class="ext-data">Gestão: ${a.gestao?.usuario||'—'} · ${new Date(a.created_at).toLocaleString('pt-BR')}</div>
            </div>
          </div>`).join('')}
    </div>`;
}

// ---------- Alunos ----------
async function renderGestaoAlunos(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-student"></i> Alunos</div><div class="pg-sub">Gerencie os alunos cadastrados no Minerva</div></div></div>
    <div class="painel" style="margin-bottom:20px">
      <div class="gestao-filtros">
        <input id="gaBusca" class="inp" style="margin-bottom:0" type="text" placeholder="Pesquisar por usuário ou conta...">
        <select id="gaFiltroTurma" class="inp gestao-select"><option value="">Todas as turmas</option></select>
        <select id="gaFiltroStatus" class="inp gestao-select">
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="bloqueado">Bloqueados</option>
        </select>
        <select id="gaOrdenar" class="inp gestao-select">
          <option value="nome">Ordenar: Nome</option>
          <option value="pontos-desc">Ordenar: Mais pontos</option>
          <option value="pontos-asc">Ordenar: Menos pontos</option>
          <option value="recentes">Ordenar: Mais recentes</option>
        </select>
      </div>
    </div>
    <div id="gestaoAlunosLista" class="painel">Carregando alunos...</div>`;

  gestaoAlunos=await carregarAlunosGestao();

  const turmas=[...new Set(gestaoAlunos.map(a=>a.turma).filter(Boolean))];
  const selTurma=document.getElementById('gaFiltroTurma');
  turmas.forEach(t=>selTurma.insertAdjacentHTML('beforeend',`<option value="${t}">${t}</option>`));

  ['gaBusca','gaFiltroTurma','gaFiltroStatus','gaOrdenar'].forEach(id=>{
    const evt = id==='gaBusca'?'input':'change';
    document.getElementById(id).addEventListener(evt, renderListaAlunos);
  });
  renderListaAlunos();
}

function renderListaAlunos(){
  const busca=(document.getElementById('gaBusca')?.value||'').toUpperCase();
  const turma=document.getElementById('gaFiltroTurma')?.value||'';
  const status=document.getElementById('gaFiltroStatus')?.value||'';
  const ordenar=document.getElementById('gaOrdenar')?.value||'nome';

  let lista=gestaoAlunos.filter(a=>{
    if(busca && !a.usuario.toUpperCase().includes(busca) && !String(a.conta).includes(busca)) return false;
    if(turma && a.turma!==turma) return false;
    if(status==='ativo' && a.bloqueado) return false;
    if(status==='bloqueado' && !a.bloqueado) return false;
    return true;
  });

  if(ordenar==='nome') lista.sort((a,b)=>a.usuario.localeCompare(b.usuario));
  else if(ordenar==='pontos-desc') lista.sort((a,b)=>b.saldo-a.saldo);
  else if(ordenar==='pontos-asc') lista.sort((a,b)=>a.saldo-b.saldo);
  else if(ordenar==='recentes') lista.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));

  const box=document.getElementById('gestaoAlunosLista');
  if(!box) return;
  box.innerHTML = lista.length===0
    ? '<div style="color:var(--cinza);text-align:center;padding:40px">Nenhum aluno encontrado.</div>'
    : `<div class="gestao-tabela">
        <div class="gestao-tabela-head"><div>Aluno</div><div>Conta</div><div>Turma</div><div>Pontos</div><div>Status</div><div>Cadastro</div><div></div></div>
        ${lista.map(a=>`
        <div class="gestao-tabela-linha">
          <div class="gt-nome"><div class="sb-avatar" style="width:32px;height:32px;font-size:.85rem">${a.usuario.charAt(0)}</div>${a.usuario}</div>
          <div>${a.conta}</div>
          <div>${a.turma||'—'}</div>
          <div style="color:var(--gelo);font-weight:700">${fmt(a.saldo)} pts</div>
          <div><span class="badge ${a.bloqueado?'badge-vermelho':'badge-verde'}">${a.bloqueado?'Bloqueado':'Ativo'}</span></div>
          <div>${a.created_at?new Date(a.created_at).toLocaleDateString('pt-BR'):'—'}</div>
          <div><button class="btn-ver-perfil" onclick="abrirPerfilAlunoGestao('${a.id}')">Ver perfil</button></div>
        </div>`).join('')}
      </div>`;
}

// ---------- Perfil do aluno (visão da Gestão) ----------
async function abrirPerfilAlunoGestao(alunoId){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML='<div style="text-align:center;padding:60px;color:var(--cinza)">Carregando perfil...</div>';

  let aluno=gestaoAlunos.find(a=>a.id===alunoId);
  if(!aluno){
    const {data}=await supabase.from('perfis').select('*').eq('id',alunoId).single();
    aluno=data;
  }
  if(!aluno){ notif('Aluno não encontrado!','erro'); return renderGestaoAba('alunos'); }

  const [{data:trans},{data:metasDb},{data:movs}]=await Promise.all([
    supabase.from('transacoes').select('*').eq('user_id',alunoId).order('created_at',{ascending:false}),
    supabase.from('metas').select('*').eq('user_id',alunoId),
    supabase.from('movimentacoes_pontos').select('*, gestao:gestao_id(usuario)').eq('aluno_id',alunoId).order('created_at',{ascending:false})
  ]);

  const historico=(trans||[]).map(t=>t.descricao);
  const metas=(metasDb||[]).map(m=>({nome:m.nome,valor:Number(m.valor),atual:Number(m.atual),concluida:m.concluida}));
  const resgates=historico.filter(h=>h.includes('TROCA'));
  const educaLocal=carregarEduca(aluno.usuario);

  gestaoAlunoAtual=aluno;

  el.innerHTML=`
    <div class="pg-header">
      <div><div class="pg-titulo">${aluno.usuario}</div><div class="pg-sub">Conta ${aluno.conta} · ${aluno.bloqueado?'<i class="ph ph-circle" style="color:var(--vermelho)"></i> Bloqueado':'<i class="ph ph-circle" style="color:var(--verde)"></i> Ativo'}${aluno.turma?' · Turma '+aluno.turma:''}</div></div>
      <button class="btn-form btn-ghost" style="width:auto;padding:10px 22px;margin-top:0" onclick="renderGestaoAba('alunos')">← Voltar</button>
    </div>

    <div class="card-saldo" style="margin-bottom:20px">
      <div class="saldo-label">Pontos atuais</div>
      <div class="saldo-valor">${fmt(aluno.saldo)} pts</div>
      <div class="saldo-conta">Conta ${aluno.conta} · Agência 0001</div>
      <div class="acoes">
        <div class="acao" onclick="modalAdicionarPontos(gestaoAlunoAtual, ()=>abrirPerfilAlunoGestao('${aluno.id}'))"><span class="ai"><i class="ph ph-plus"></i></span>Adicionar pontos</div>
        <div class="acao" onclick="modalRemoverPontos(gestaoAlunoAtual, ()=>abrirPerfilAlunoGestao('${aluno.id}'))"><span class="ai"><i class="ph ph-minus"></i></span>Remover pontos</div>
      </div>
    </div>

    <div id="copaSecaoPerfil" class="painel" style="margin-bottom:20px">Carregando dados da Copa das Salas...</div>

    <div class="grid2" style="margin-bottom:20px">
      <div class="painel">
        <div class="painel-h"><i class="ph ph-target"></i> Metas</div>
        ${metas.length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Sem metas cadastradas.</div>':
          metas.map(m=>`<div class="meta-card" style="margin-bottom:10px">
            <div class="meta-nome">${m.nome}</div>
            <div class="meta-vals">Atual: <span>${fmt(m.atual)}</span> / <span>${fmt(m.valor)}</span> pts</div>
            <div class="progress"><div class="progress-fill" style="width:${Math.min(100,(m.atual/(m.valor||1))*100)}%"></div></div>
            ${m.concluida?'<div class="meta-ok"><i class="ph ph-check-circle"></i> Concluída</div>':''}
          </div>`).join('')}
      </div>
      <div class="painel">
        <div class="painel-h"><i class="ph ph-trophy"></i> Conquistas & Minerva Educa</div>
        <div style="color:var(--cinza);font-size:.85rem;margin-bottom:10px">XP: <b style="color:var(--gelo)">${educaLocal.xp}</b> · Minervas: <b style="color:var(--gelo)">${educaLocal.minervas} <i class="ph ph-coins"></i></b> · Atividades concluídas: <b style="color:var(--gelo)">${educaLocal.atividadesConcluidas.length}</b></div>
        <div style="color:var(--cinza);font-size:.76rem">* O progresso do Minerva Educa é salvo no dispositivo do aluno; pode não refletir o uso em outros aparelhos.</div>
      </div>
    </div>

    <div class="grid2" style="margin-bottom:20px">
      <div class="painel">
        <div class="painel-h"><i class="ph ph-gift"></i> Recompensas resgatadas</div>
        ${resgates.length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhum resgate ainda.</div>':resgates.slice(0,8).map(h=>renderExtItem(h)).join('')}
      </div>
      <div class="painel">
        <div class="painel-h"><i class="ph ph-clipboard-text"></i> Histórico geral</div>
        ${historico.length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhuma movimentação ainda.</div>':historico.slice(0,8).map(h=>renderExtItem(h)).join('')}
      </div>
    </div>

    <div class="painel">
      <div class="painel-h">⭐ Movimentações administrativas de pontos</div>
      ${(movs||[]).length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhuma alteração da Gestão ainda.</div>':
        (movs||[]).map(m=>`
        <div class="admin-hist-item">
          <div class="admin-hist-top">
            <span class="${m.tipo==='adicao'?'val-pos':'val-neg'}">${m.tipo==='adicao'?'+':'-'}${fmt(m.quantidade)} pts</span>
            <span class="admin-hist-data">${new Date(m.created_at).toLocaleString('pt-BR')}</span>
          </div>
          <div class="admin-hist-motivo">Motivo: ${m.motivo}</div>
          <div class="admin-hist-meta">Gestão: ${m.gestao?.usuario||'—'} · Antes: ${fmt(m.saldo_anterior)} · Depois: ${fmt(m.saldo_novo)}</div>
        </div>`).join('')}
    </div>`;

  renderCopaSecaoPerfil(aluno);
}

// ---------- Adicionar / Remover pontos ----------
function modalAdicionarPontos(aluno,onDone){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  modal(`<i class="ph ph-plus"></i> Adicionar Pontos — ${aluno.usuario}`,
    `<label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Quantidade de pontos</label>
     <input id="gpQtd" class="inp" type="text" placeholder="Ex: 100">
     <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Motivo da alteração</label>
     <input id="gpMotivo" class="inp" type="text" placeholder="Ex: Participação em atividade escolar" style="margin-bottom:0">`,
    async ()=>{
      const qtd=parseValor(document.getElementById('gpQtd').value);
      const motivo=document.getElementById('gpMotivo').value.trim();
      if(isNaN(qtd)||qtd<=0) return notif('Quantidade inválida!','erro');
      if(!motivo) return notif('Informe o motivo da alteração!','erro');
      await confirmarAlteracaoPontos('adicao',aluno,qtd,motivo,onDone);
    });
}

function modalRemoverPontos(aluno,onDone){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  modal(`<i class="ph ph-minus"></i> Remover Pontos — ${aluno.usuario}`,
    `<div style="font-size:.8rem;color:var(--cinza);margin-bottom:14px">Saldo atual: <b style="color:var(--gelo)">${fmt(aluno.saldo)} pts</b></div>
     <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Quantidade de pontos</label>
     <input id="gpQtd" class="inp" type="text" placeholder="Ex: 50">
     <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Motivo da alteração</label>
     <input id="gpMotivo" class="inp" type="text" placeholder="Ex: Uso indevido de material" style="margin-bottom:0">`,
    async ()=>{
      const qtd=parseValor(document.getElementById('gpQtd').value);
      const motivo=document.getElementById('gpMotivo').value.trim();
      if(isNaN(qtd)||qtd<=0) return notif('Quantidade inválida!','erro');
      if(!motivo) return notif('Informe o motivo da alteração!','erro');
      if(qtd>aluno.saldo) return notif('O aluno não possui pontos suficientes para essa remoção!','erro');
      await confirmarAlteracaoPontos('remocao',aluno,qtd,motivo,onDone);
    });
}

async function confirmarAlteracaoPontos(tipo,aluno,quantidade,motivo,onDone){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  const saldoAnterior=Number(aluno.saldo);
  let saldoNovo;
  if(tipo==='adicao'){
    saldoNovo=saldoAnterior+quantidade;
  }else{
    if(quantidade>saldoAnterior) return notif('O aluno não possui pontos suficientes para essa remoção!','erro');
    saldoNovo=Math.max(0,saldoAnterior-quantidade);
  }

  const {error:erroSaldo}=await supabase.from('perfis').update({saldo:saldoNovo}).eq('id',aluno.id);
  if(erroSaldo){ console.error(erroSaldo); return notif('Erro ao atualizar saldo: '+erroSaldo.message,'erro'); }

  const {error:erroMov}=await supabase.from('movimentacoes_pontos').insert({
    aluno_id:aluno.id, gestao_id:usuarios[logado].id, tipo, quantidade,
    motivo, saldo_anterior:saldoAnterior, saldo_novo:saldoNovo
  });
  if(erroMov) console.error('Erro ao salvar movimentação administrativa:',erroMov);

  const rotulo=tipo==='adicao'?'PONTOS ADICIONADOS':'PONTOS REMOVIDOS';
  const sinal=tipo==='adicao'?'+':'-';
  const {error:erroTrans}=await supabase.from('transacoes').insert({
    user_id:aluno.id,
    descricao:`[${hora()}] ${rotulo} (GESTÃO ${logado}): ${sinal}${fmt(quantidade)} pts — Motivo: ${motivo}`
  });
  if(erroTrans) console.error('Erro ao registrar no extrato do aluno:',erroTrans);

  aluno.saldo=saldoNovo;
  const cache=gestaoAlunos.find(a=>a.id===aluno.id);
  if(cache) cache.saldo=saldoNovo;

  fecharModal();
  notif(`${tipo==='adicao'?'<i class="ph ph-check-circle"></i> +':'<i class="ph ph-check-circle"></i> -'}${fmt(quantidade)} pts para ${aluno.usuario}!`);
  if(onDone) onDone();
}

// ---------- Tab "Pontos" (acesso rápido) ----------
async function renderGestaoPontos(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo">⭐ Gerenciar Pontos</div><div class="pg-sub">Adicione ou remova pontos de um aluno rapidamente</div></div></div>
    <div class="painel" style="max-width:560px">
      <div class="painel-h">Selecione o aluno</div>
      <select id="gpSelectAluno" class="inp gestao-select" style="margin-bottom:16px"><option value="">Carregando alunos...</option></select>
      <div id="gpAlunoInfo"></div>
    </div>`;

  gestaoAlunos=gestaoAlunos.length?gestaoAlunos:await carregarAlunosGestao();
  const sel=document.getElementById('gpSelectAluno');
  sel.innerHTML=`<option value="">Selecione...</option>`+gestaoAlunos.map(a=>`<option value="${a.id}">${a.usuario} — ${fmt(a.saldo)} pts</option>`).join('');
  sel.addEventListener('change',()=>{
    const aluno=gestaoAlunos.find(a=>a.id===sel.value);
    const info=document.getElementById('gpAlunoInfo');
    if(!aluno){ info.innerHTML=''; return; }
    info.innerHTML=`
      <div class="pix-saldo-box" style="margin-bottom:16px"><div class="lbl">Saldo atual de ${aluno.usuario}</div><div class="val">${fmt(aluno.saldo)} pts</div></div>
      <div class="acoes">
        <div class="acao" onclick='modalAdicionarPontos(gestaoAlunos.find(x=>x.id==="${aluno.id}"), renderGestaoPontos)'><span class="ai"><i class="ph ph-plus"></i></span>Adicionar</div>
        <div class="acao" onclick='modalRemoverPontos(gestaoAlunos.find(x=>x.id==="${aluno.id}"), renderGestaoPontos)'><span class="ai"><i class="ph ph-minus"></i></span>Remover</div>
      </div>`;
  });
}

// ---------- Recompensas ----------
async function renderGestaoRecompensas(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML=`<div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-gift"></i> Recompensas</div><div class="pg-sub">Catálogo atual da área Trocas e total de resgates</div></div></div>
    <div id="gestaoRecompensasLista" class="painel">Carregando...</div>`;

  const {data:trocas,error}=await supabase.from('transacoes').select('descricao').ilike('descricao','%TROCA%');
  if(error) console.error(error);
  const contagem={};
  (trocas||[]).forEach(t=>{
    const premio=premios.find(p=>t.descricao.includes(p.nome));
    const chave=premio?premio.nome:'Outro';
    contagem[chave]=(contagem[chave]||0)+1;
  });

  document.getElementById('gestaoRecompensasLista').innerHTML=`
    <div class="painel-h" style="margin-bottom:14px">Catálogo (gerenciado na área Trocas do aluno — somente leitura aqui)</div>
    <div class="gestao-tabela">
      <div class="gestao-tabela-head" style="grid-template-columns:2fr 1fr 1fr;min-width:0"><div>Recompensa</div><div>Custo</div><div>Resgates</div></div>
      ${premios.map(p=>`<div class="gestao-tabela-linha" style="grid-template-columns:2fr 1fr 1fr;min-width:0">
        <div class="gt-nome">${p.icone} ${p.nome}</div>
        <div>${fmt(p.valor)} pts</div>
        <div>${contagem[p.nome]||0}</div>
      </div>`).join('')}
    </div>`;
}

// ---------- Histórico administrativo ----------
async function renderGestaoHistorico(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-clipboard-text"></i> Histórico Administrativo</div><div class="pg-sub">Todas as alterações de pontos feitas pela Gestão</div></div></div>
    <div class="painel" style="margin-bottom:16px">
      <input id="ghBusca" class="inp" style="margin-bottom:0" type="text" placeholder="Filtrar por aluno...">
    </div>
    <div id="gestaoHistoricoLista" class="painel">Carregando...</div>`;

  const {data,error}=await supabase.from('movimentacoes_pontos')
    .select('*, aluno:aluno_id(usuario), gestao:gestao_id(usuario)')
    .order('created_at',{ascending:false});
  if(error){ console.error(error); notif('Erro ao carregar histórico: '+error.message,'erro'); }
  const movs=data||[];

  const render=()=>{
    const filtro=(document.getElementById('ghBusca')?.value||'').toUpperCase();
    const lista=movs.filter(m=>!filtro || (m.aluno?.usuario||'').toUpperCase().includes(filtro));
    document.getElementById('gestaoHistoricoLista').innerHTML = lista.length===0
      ?'<div style="color:var(--cinza);text-align:center;padding:30px">Nenhum registro encontrado.</div>'
      :lista.map(m=>`
        <div class="admin-hist-item">
          <div class="admin-hist-top">
            <span>${m.aluno?.usuario||'—'} <span class="${m.tipo==='adicao'?'val-pos':'val-neg'}">${m.tipo==='adicao'?'+':'-'}${fmt(m.quantidade)} pts</span></span>
            <span class="admin-hist-data">${new Date(m.created_at).toLocaleString('pt-BR')}</span>
          </div>
          <div class="admin-hist-motivo">Motivo: ${m.motivo}</div>
          <div class="admin-hist-meta">Gestão: ${m.gestao?.usuario||'—'} · Antes: ${fmt(m.saldo_anterior)} · Depois: ${fmt(m.saldo_novo)}</div>
        </div>`).join('');
  };
  document.getElementById('ghBusca').addEventListener('input',render);
  render();
}

// ---------- Relatórios ----------
async function renderGestaoRelatorios(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML=`<div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-chart-bar"></i> Relatórios</div><div class="pg-sub">Panorama geral de pontos e engajamento</div></div></div>
    <div style="text-align:center;color:var(--cinza);padding:30px">Carregando relatório...</div>`;

  const [{data:movs},alunos]=await Promise.all([
    supabase.from('movimentacoes_pontos').select('*, aluno:aluno_id(usuario)'),
    carregarAlunosGestao()
  ]);
  gestaoAlunos = alunos.length?alunos:gestaoAlunos;

  const porAluno={};
  (movs||[]).forEach(m=>{
    const nome=m.aluno?.usuario||'—';
    porAluno[nome]=porAluno[nome]||{adicionado:0,removido:0};
    if(m.tipo==='adicao') porAluno[nome].adicionado+=Number(m.quantidade);
    else porAluno[nome].removido+=Number(m.quantidade);
  });
  const rankingSaldo=[...gestaoAlunos].sort((a,b)=>b.saldo-a.saldo).slice(0,8);
  const maiorSaldo=rankingSaldo[0]?.saldo||1;

  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-chart-bar"></i> Relatórios</div><div class="pg-sub">Panorama geral de pontos e engajamento</div></div></div>
    <div class="painel" style="margin-bottom:20px">
      <div class="painel-h"><i class="ph ph-trophy"></i> Ranking de pontos (top 8 alunos)</div>
      ${rankingSaldo.length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhum aluno cadastrado ainda.</div>':
        rankingSaldo.map(a=>`
        <div class="kpi-bar-wrap">
          <div class="kpi-bar-label"><span>${a.usuario}</span><span>${fmt(a.saldo)} pts</span></div>
          <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${Math.max(4,(a.saldo/maiorSaldo)*100)}%;background:linear-gradient(90deg,#0077B6,var(--azul))"></div></div>
        </div>`).join('')}
    </div>
    <div class="painel">
      <div class="painel-h">⭐ Movimentações por aluno</div>
      ${Object.keys(porAluno).length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhuma movimentação administrativa ainda.</div>':
        Object.entries(porAluno).map(([nome,v])=>`
        <div class="gestao-tabela-linha" style="grid-template-columns:1.4fr 1fr 1fr;min-width:0">
          <div class="gt-nome">${nome}</div>
          <div class="val-pos">+${fmt(v.adicionado)}</div>
          <div class="val-neg">-${fmt(v.removido)}</div>
        </div>`).join('')}
    </div>`;
}

// ---------- Configurações ----------
function renderGestaoConfig(){
  const el=document.getElementById('gestaoConteudo');
  const claro=document.body.classList.contains('tema-claro');
  el.innerHTML=`
    <div class="pg-header"><div><div class="pg-titulo"><i class="ph ph-gear"></i> Configurações</div><div class="pg-sub">Informações da sua conta de Gestão</div></div></div>
    <div class="painel" style="max-width:520px;margin-bottom:20px">
      <div class="painel-h">Conta</div>
      <div class="ext-item"><div class="ext-ic ic-n"><i class="ph ph-briefcase"></i></div><div class="ext-info"><div class="ext-desc">${logado}</div><div class="ext-data">Tipo de usuário: Gestão</div></div></div>
      <div style="margin-top:18px;color:var(--cinza);font-size:.82rem;line-height:1.6">
        Para criar novas contas de Gestão, compartilhe o código de autorização apenas com pessoas autorizadas.
        O código é validado no cadastro e protegido no banco de dados (Supabase).
      </div>
    </div>
    <div class="painel" style="max-width:520px;margin-bottom:20px">
      <div class="painel-h"><i class="ph ph-palette"></i> Tema</div>
      <div class="tipo-conta-btns">
        <button type="button" class="tipo-conta-btn ${!claro?'ativo':''}" onclick="aplicarTema('escuro'), renderGestaoConfig()"><i class="ph ph-moon"></i> Preto (original)</button>
        <button type="button" class="tipo-conta-btn ${claro?'ativo':''}" onclick="aplicarTema('claro'), renderGestaoConfig()"><i class="ph ph-sun"></i> Branco</button>
      </div>
    </div>
    <div class="painel" style="max-width:520px">
      <div class="painel-h">Sessão</div>
      <button class="btn-form" style="background:rgba(239,68,68,.15);color:#fca5a5" onclick="logout()">↩ Sair da conta</button>
    </div>`;
}

// ============================================================
// ============ COPA DAS SALAS (módulo adicional) ============
// ============================================================
let copaSubTab='ranking';
let gestaoTurmas=[];
let copaConfigPesos={peso_tarefas:200,peso_prova:200,peso_presenca:200};
let copaBimestreAtual=null;
let copaTurmaSelecionada=null;
let copaAlunoPerfilAtual=null;

function calcPontosCriterio(pct,peso){
  const p=Number(pct)||0;
  return Math.round((p/100)*Number(peso||0));
}

async function carregarCopaConfig(){
  const {data,error}=await supabase.from('copa_config').select('*').eq('id',1).single();
  if(!error && data) copaConfigPesos={peso_tarefas:Number(data.peso_tarefas),peso_prova:Number(data.peso_prova),peso_presenca:Number(data.peso_presenca)};
  return copaConfigPesos;
}

async function carregarBimestreAtual(){
  const {data,error}=await supabase.from('bimestres').select('*').eq('status','aberto').order('numero',{ascending:false}).limit(1).maybeSingle();
  if(!error && data) copaBimestreAtual=data;
  return copaBimestreAtual;
}

async function carregarTurmas(){
  const {data,error}=await supabase.from('turmas').select('*').order('pontuacao',{ascending:false});
  if(error){ console.error(error); gestaoTurmas=[]; return []; }
  gestaoTurmas=data||[];
  return gestaoTurmas;
}

async function carregarAlunosDaTurma(turmaNome){
  const {data,error}=await supabase.from('perfis').select('*').eq('tipo_usuario','aluno').eq('turma',turmaNome).order('usuario');
  if(error){ console.error(error); return []; }
  return data||[];
}

// última avaliação de cada aluno no bimestre informado
async function carregarAvaliacoesBimestre(bimestreNumero){
  const {data,error}=await supabase.from('avaliacoes_alunos').select('*').eq('bimestre',bimestreNumero).order('created_at',{ascending:false});
  if(error){ console.error(error); return {}; }
  const porAluno={};
  (data||[]).forEach(a=>{ if(!porAluno[a.aluno_id]) porAluno[a.aluno_id]=a; });
  return porAluno;
}

async function carregarBonusBimestre(bimestreNumero){
  const {data,error}=await supabase.from('copa_bonus_pontos').select('*').eq('bimestre',bimestreNumero);
  if(error){ console.error(error); return []; }
  return data||[];
}

// recalcula a pontuação total de uma turma a partir das avaliações + bônus do bimestre atual
async function recalcularPontuacaoTurma(turmaNome){
  if(!copaBimestreAtual) await carregarBimestreAtual();
  if(!copaBimestreAtual) return 0;
  const alunos=await carregarAlunosDaTurma(turmaNome);
  const avaliacoes=await carregarAvaliacoesBimestre(copaBimestreAtual.numero);
  const bonus=await carregarBonusBimestre(copaBimestreAtual.numero);
  let total=0;
  alunos.forEach(a=>{ const av=avaliacoes[a.id]; if(av) total+=Number(av.pontos_total); });
  bonus.forEach(b=>{
    if(alunos.some(a=>a.id===b.aluno_id)) total += b.tipo==='adicao'?Number(b.quantidade):-Number(b.quantidade);
  });
  total=Math.max(0,total);
  const {error}=await supabase.from('turmas').update({pontuacao:total}).eq('nome',turmaNome);
  if(error) console.error('Erro ao atualizar pontuação da turma:',error);
  const t=gestaoTurmas.find(x=>x.nome===turmaNome);
  if(t) t.pontuacao=total;
  return total;
}

// pontos acadêmicos individuais de um aluno no bimestre atual (avaliação + bônus)
async function calcularPontosIndividuais(alunoId,bimestreNumero){
  const {data:av}=await supabase.from('avaliacoes_alunos').select('*').eq('aluno_id',alunoId).eq('bimestre',bimestreNumero).order('created_at',{ascending:false}).limit(1).maybeSingle();
  const {data:bonusList}=await supabase.from('copa_bonus_pontos').select('*').eq('aluno_id',alunoId).eq('bimestre',bimestreNumero);
  const bonusTotal=(bonusList||[]).reduce((s,b)=>s+(b.tipo==='adicao'?Number(b.quantidade):-Number(b.quantidade)),0);
  return {avaliacao:av||null, bonus:bonusTotal, bonusList:bonusList||[]};
}

// ---------- Dispatcher / subnav (Gestão) ----------
async function renderGestaoCopa(){
  const el=document.getElementById('gestaoConteudo');
  el.innerHTML='<div style="text-align:center;color:var(--cinza);padding:30px">Carregando Copa das Salas...</div>';
  await Promise.all([carregarCopaConfig(),carregarBimestreAtual(),carregarTurmas()]);

  el.innerHTML=`
    <div class="pg-header">
      <div><div class="pg-titulo"><svg class="copa-shield-icon" style="width:22px;height:22px;vertical-align:-4px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/></svg> Copa das Salas</div>
      <div class="pg-sub">${copaBimestreAtual?`Bimestre atual: ${copaBimestreAtual.numero}º`:'Nenhum bimestre aberto — encerre/inicie em "Histórico da Copa".'}</div></div>
      <span class="badge badge-gestao">● Gestão</span>
    </div>
    <div class="copa-subnav">
      <button data-tab="ranking" class="${copaSubTab==='ranking'?'ativo':''}" onclick="copaAba('ranking')">Ranking</button>
      <button data-tab="turmas" class="${copaSubTab==='turmas'?'ativo':''}" onclick="copaAba('turmas')">Turmas</button>
      <button data-tab="avaliar" class="${copaSubTab==='avaliar'?'ativo':''}" onclick="copaAba('avaliar')">Avaliações</button>
      <button data-tab="historico" class="${copaSubTab==='historico'?'ativo':''}" onclick="copaAba('historico')">Histórico da Copa</button>
      <button data-tab="config" class="${copaSubTab==='config'?'ativo':''}" onclick="copaAba('config')">Configurações</button>
    </div>
    <div id="copaConteudo"></div>`;

  renderGestaoCopaConteudo();
}

function copaAba(tab){
  copaSubTab=tab;
  document.querySelectorAll('.copa-subnav button').forEach(b=>b.classList.toggle('ativo',b.dataset.tab===tab));
  renderGestaoCopaConteudo();
}

function renderGestaoCopaConteudo(){
  if(copaSubTab==='ranking') return renderCopaRankingGestao();
  if(copaSubTab==='turmas') return renderCopaTurmasGestao();
  if(copaSubTab==='avaliar') return renderCopaAvaliarGestao();
  if(copaSubTab==='historico') return renderCopaHistoricoGestao();
  if(copaSubTab==='config') return renderCopaConfigGestao();
}

function medalhaSvg(pos){
  const cores={1:'#facc15',2:'#cbd5e1',3:'#d97706'};
  const cor=cores[pos]||'#94a3b8';
  return `<svg class="copa-medal-svg" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2">
    <circle cx="12" cy="14" r="7" fill="${cor}" fill-opacity=".18"/>
    <circle cx="12" cy="14" r="7"/>
    <path d="M9 2l3 5 3-5" fill="none"/>
  </svg>`;
}

// ---------- Ranking ----------
async function renderCopaRankingGestao(){
  const el=document.getElementById('copaConteudo');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;color:var(--cinza);padding:20px">Carregando ranking...</div>';
  const turmas=gestaoTurmas.length?gestaoTurmas:await carregarTurmas();
  const ordenado=[...turmas].sort((a,b)=>b.pontuacao-a.pontuacao);
  el.innerHTML=`
    <div class="painel">
      <div class="painel-h">Classificação geral — ${copaBimestreAtual?copaBimestreAtual.numero+'º bimestre':'—'}</div>
      ${ordenado.length===0?'<div style="color:var(--cinza);text-align:center;padding:30px">Nenhuma turma cadastrada ainda. Crie turmas na aba "Turmas".</div>':
      `<div class="copa-ranking-lista">
        ${ordenado.map((t,i)=>{
          const pos=i+1;
          return `<div class="copa-ranking-item ${pos<=3?'pos-'+pos:''}">
            <div class="copa-pos-badge ${pos<=3?'md-'+pos:''}">${pos}º</div>
            <div class="copa-ranking-info">
              <div class="copa-ranking-nome">${t.nome}${pos<=3?medalhaSvg(pos):''}</div>
              <div class="copa-ranking-sub">${t.serie||'—'} · Status: ${t.status}</div>
            </div>
            <div class="copa-ranking-pts">${fmt(t.pontuacao)} pts</div>
          </div>`;
        }).join('')}
      </div>`}
    </div>`;
}

// ---------- Turmas ----------
async function renderCopaTurmasGestao(){
  const el=document.getElementById('copaConteudo');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;color:var(--cinza);padding:20px">Carregando turmas...</div>';
  const turmas=await carregarTurmas();
  el.innerHTML=`
    <div class="painel" style="margin-bottom:18px">
      <div class="painel-h" style="display:flex;justify-content:space-between;align-items:center">
        <span>Turmas cadastradas</span>
        <button class="btn-form btn-verde" style="width:auto;padding:9px 18px;margin-top:0" onclick="modalNovaTurma()">+ Nova turma</button>
      </div>
    </div>
    <div class="grid3" id="copaTurmasGrid">
      ${turmas.length===0?'<div style="color:var(--cinza);padding:20px">Nenhuma turma cadastrada ainda.</div>':
        turmas.map(t=>`
        <div class="copa-turma-card" onclick="abrirTurmaGestao('${t.id}')">
          <div class="copa-turma-nome">${t.nome}</div>
          <div class="copa-turma-meta">${t.serie||'—'} · ${t.status}</div>
          <div class="copa-turma-pts">${fmt(t.pontuacao)} pts</div>
        </div>`).join('')}
    </div>`;
}

function modalNovaTurma(){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  modal('+ Nova turma',
    `<label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Nome da turma</label>
     <input id="ntNome" class="inp" type="text" placeholder="Ex: 2º D">
     <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Série/ano</label>
     <input id="ntSerie" class="inp" type="text" placeholder="Ex: 2º ano" style="margin-bottom:0">`,
    async ()=>{
      const nome=document.getElementById('ntNome').value.trim();
      const serie=document.getElementById('ntSerie').value.trim();
      if(!nome) return notif('Informe o nome da turma!','erro');
      const {error}=await supabase.from('turmas').insert({nome,serie,bimestre_atual:copaBimestreAtual?copaBimestreAtual.numero:1});
      if(error){ console.error(error); return notif('Erro ao criar turma: '+error.message,'erro'); }
      fecharModal();
      notif('Turma criada!');
      renderCopaTurmasGestao();
    });
}

async function abrirTurmaGestao(turmaId){
  const turma=gestaoTurmas.find(t=>t.id===turmaId);
  if(!turma) return;
  copaTurmaSelecionada=turma;
  const el=document.getElementById('copaConteudo');
  el.innerHTML='<div style="text-align:center;color:var(--cinza);padding:20px">Carregando alunos da turma...</div>';

  const alunos=await carregarAlunosDaTurma(turma.nome);
  const bimestreNum=copaBimestreAtual?copaBimestreAtual.numero:1;
  const avaliacoes=await carregarAvaliacoesBimestre(bimestreNum);

  el.innerHTML=`
    <div class="pg-header">
      <div><div class="pg-titulo">${turma.nome}</div><div class="pg-sub">${turma.serie||'—'} · ${fmt(turma.pontuacao)} pts</div></div>
      <button class="btn-form btn-ghost" style="width:auto;padding:10px 22px;margin-top:0" onclick="copaAba('turmas')">← Voltar</button>
    </div>
    <div class="painel">
      <div class="painel-h">Alunos da turma (${alunos.length})</div>
      ${alunos.length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhum aluno vinculado a esta turma ainda. Atribua a turma na tela "Ver perfil" de cada aluno, em Alunos.</div>':
        `<div class="gestao-tabela">
          <div class="gestao-tabela-head" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr"><div>Aluno</div><div>Tarefas SP</div><div>Prova Paulista</div><div>Presença</div><div>Pontos</div></div>
          ${alunos.map(a=>{
            const av=avaliacoes[a.id];
            return `<div class="gestao-tabela-linha" style="grid-template-columns:2fr 1fr 1fr 1fr 1fr">
              <div class="gt-nome"><div class="sb-avatar" style="width:32px;height:32px;font-size:.85rem">${a.usuario.charAt(0)}</div>${a.usuario}</div>
              <div>${av?av.tarefas_sp+'%':'—'}</div>
              <div>${av?av.prova_paulista+'%':'—'}</div>
              <div>${av?av.presenca+'%':'—'}</div>
              <div style="color:var(--gelo);font-weight:700">${av?fmt(av.pontos_total):'0'}</div>
            </div>`;
          }).join('')}
        </div>`}
    </div>`;
}

// ---------- Avaliações ----------
async function renderCopaAvaliarGestao(){
  const el=document.getElementById('copaConteudo');
  if(!el) return;
  const turmas=gestaoTurmas.length?gestaoTurmas:await carregarTurmas();
  el.innerHTML=`
    <div class="painel" style="max-width:560px">
      <div class="painel-h">Lançar avaliação (Tarefas SP, Prova Paulista, Presença)</div>
      <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Turma</label>
      <select id="avTurma" class="inp gestao-select"><option value="">Selecione a turma...</option>${turmas.map(t=>`<option value="${t.nome}">${t.nome}</option>`).join('')}</select>
      <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Aluno</label>
      <select id="avAluno" class="inp gestao-select"><option value="">Selecione a turma primeiro...</option></select>
      <div id="avForm"></div>
    </div>`;

  document.getElementById('avTurma').addEventListener('change', async ()=>{
    const nome=document.getElementById('avTurma').value;
    const selAluno=document.getElementById('avAluno');
    selAluno.innerHTML='<option value="">Carregando...</option>';
    document.getElementById('avForm').innerHTML='';
    if(!nome) return;
    const alunos=await carregarAlunosDaTurma(nome);
    selAluno.innerHTML='<option value="">Selecione...</option>'+alunos.map(a=>`<option value="${a.id}" data-nome="${a.usuario}">${a.usuario}</option>`).join('');
  });

  document.getElementById('avAluno').addEventListener('change', ()=>{
    const sel=document.getElementById('avAluno');
    const alunoId=sel.value;
    const alunoNome=sel.selectedOptions[0]?.dataset.nome;
    const form=document.getElementById('avForm');
    if(!alunoId){ form.innerHTML=''; return; }
    form.innerHTML=`
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--borda)">
        <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Tarefas SP (%)</label>
        <input id="avTarefas" class="inp" type="number" min="0" max="100" placeholder="Ex: 92">
        <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Prova Paulista (%)</label>
        <input id="avProva" class="inp" type="number" min="0" max="100" placeholder="Ex: 84">
        <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Presença (%)</label>
        <input id="avPresenca" class="inp" type="number" min="0" max="100" placeholder="Ex: 96" style="margin-bottom:14px">
        <button class="btn-form btn-azul" onclick="salvarAvaliacaoAluno('${alunoId}','${document.getElementById('avTurma').value}','${alunoNome}')">Salvar avaliação</button>
      </div>`;
  });
}

async function salvarAvaliacaoAluno(alunoId,turmaNome,alunoNome){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  const tarefas=Number(document.getElementById('avTarefas').value);
  const prova=Number(document.getElementById('avProva').value);
  const presenca=Number(document.getElementById('avPresenca').value);
  if([tarefas,prova,presenca].some(v=>isNaN(v)||v<0||v>100)) return notif('Informe valores entre 0 e 100!','erro');

  await carregarCopaConfig();
  if(!copaBimestreAtual) await carregarBimestreAtual();
  if(!copaBimestreAtual) return notif('Nenhum bimestre aberto. Abra um bimestre em "Histórico da Copa".','erro');

  const pontosTarefas=calcPontosCriterio(tarefas,copaConfigPesos.peso_tarefas);
  const pontosProva=calcPontosCriterio(prova,copaConfigPesos.peso_prova);
  const pontosPresenca=calcPontosCriterio(presenca,copaConfigPesos.peso_presenca);
  const pontosTotal=pontosTarefas+pontosProva+pontosPresenca;

  const {error}=await supabase.from('avaliacoes_alunos').insert({
    aluno_id:alunoId, turma_nome:turmaNome, bimestre:copaBimestreAtual.numero,
    tarefas_sp:tarefas, prova_paulista:prova, presenca:presenca,
    pontos_tarefas:pontosTarefas, pontos_prova:pontosProva, pontos_presenca:pontosPresenca,
    pontos_total:pontosTotal, gestao_id:usuarios[logado].id
  });
  if(error){ console.error(error); return notif('Erro ao salvar avaliação: '+error.message,'erro'); }

  await recalcularPontuacaoTurma(turmaNome);
  notif(`Avaliação de ${alunoNome} salva! +${fmt(pontosTotal)} pts acadêmicos.`);
  renderCopaAvaliarGestao();
}

// ---------- Bônus administrativo (Copa) ----------
function modalBonusCopa(aluno,tipo,onDone){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  if(!aluno.turma) return notif('Este aluno ainda não está vinculado a uma turma da Copa!','erro');
  const rotulo=tipo==='adicao'?'Adicionar':'Remover';
  modal(`${rotulo} pontos bônus (Copa) — ${aluno.usuario}`,
    `<label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Quantidade de pontos</label>
     <input id="cbQtd" class="inp" type="text" placeholder="Ex: 100">
     <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Motivo</label>
     <input id="cbMotivo" class="inp" type="text" placeholder="Ex: Participação exemplar em evento" style="margin-bottom:0">`,
    async ()=>{
      const qtd=parseValor(document.getElementById('cbQtd').value);
      const motivo=document.getElementById('cbMotivo').value.trim();
      if(isNaN(qtd)||qtd<=0) return notif('Quantidade inválida!','erro');
      if(!motivo) return notif('Informe o motivo!','erro');
      if(!copaBimestreAtual) await carregarBimestreAtual();
      if(!copaBimestreAtual) return notif('Nenhum bimestre aberto na Copa!','erro');
      const {error}=await supabase.from('copa_bonus_pontos').insert({
        aluno_id:aluno.id, turma_nome:aluno.turma, bimestre:copaBimestreAtual.numero,
        tipo, quantidade:qtd, motivo, gestao_id:usuarios[logado].id
      });
      if(error){ console.error(error); return notif('Erro: '+error.message,'erro'); }
      await recalcularPontuacaoTurma(aluno.turma);
      fecharModal();
      notif(`Pontos bônus (Copa) ${tipo==='adicao'?'adicionados':'removidos'}!`);
      if(onDone) onDone();
    });
}

// ---------- Definir turma do aluno ----------
function modalDefinirTurmaAluno(aluno,onDone){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  const turmas=gestaoTurmas;
  modal(`Definir turma — ${aluno.usuario}`,
    `<label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Turma</label>
     <select id="dtTurma" class="inp gestao-select" style="margin-bottom:0">
       <option value="">Sem turma</option>
       ${turmas.map(t=>`<option value="${t.nome}" ${aluno.turma===t.nome?'selected':''}>${t.nome}</option>`).join('')}
     </select>`,
    async ()=>{
      const nova=document.getElementById('dtTurma').value||null;
      const antiga=aluno.turma;
      const {error}=await supabase.from('perfis').update({turma:nova}).eq('id',aluno.id);
      if(error){ console.error(error); return notif('Erro ao atualizar turma: '+error.message,'erro'); }
      aluno.turma=nova;
      const cache=gestaoAlunos.find(a=>a.id===aluno.id);
      if(cache) cache.turma=nova;
      fecharModal();
      notif('Turma atualizada!');
      if(antiga) recalcularPontuacaoTurma(antiga);
      if(nova) recalcularPontuacaoTurma(nova);
      if(onDone) onDone();
    });
}

// ---------- Seção Copa no perfil do aluno (visão da Gestão) ----------
async function renderCopaSecaoPerfil(aluno){
  const box=document.getElementById('copaSecaoPerfil');
  if(!box) return;
  await Promise.all([carregarCopaConfig(),carregarBimestreAtual(),carregarTurmas().catch(()=>{})]);
  const bimestreNum=copaBimestreAtual?copaBimestreAtual.numero:1;
  const {avaliacao,bonus}=await calcularPontosIndividuais(aluno.id,bimestreNum);
  copaAlunoPerfilAtual=aluno;

  box.innerHTML=`
    <div class="painel-h" style="display:flex;justify-content:space-between;align-items:center">
      <span><svg class="copa-shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/></svg>Copa das Salas</span>
      <span class="copa-badge-chip">Turma: ${aluno.turma||'sem turma'}</span>
    </div>
    <button class="btn-form btn-ghost" style="width:auto;padding:8px 16px;margin:10px 0" onclick="modalDefinirTurmaAluno(copaAlunoPerfilAtual, ()=>abrirPerfilAlunoGestao('${aluno.id}'))">Alterar turma</button>

    <div class="painel-h" style="margin-top:6px">Desempenho Acadêmico — ${bimestreNum}º bimestre</div>
    ${avaliacao?`
      <table class="copa-crit-table">
        <thead><tr><th>Critério</th><th>Resultado</th><th>Pontos</th></tr></thead>
        <tbody>
          <tr><td>Tarefas SP</td><td>${avaliacao.tarefas_sp}%</td><td>${fmt(avaliacao.pontos_tarefas)}</td></tr>
          <tr><td>Prova Paulista</td><td>${avaliacao.prova_paulista}%</td><td>${fmt(avaliacao.pontos_prova)}</td></tr>
          <tr><td>Presença</td><td>${avaliacao.presenca}%</td><td>${fmt(avaliacao.pontos_presenca)}</td></tr>
        </tbody>
      </table>
      <div class="ext-item" style="margin-top:10px">
        <div class="ext-info">
          <div class="ext-desc">Tarefas SP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+${fmt(avaliacao.pontos_tarefas)}<br>Prova Paulista&nbsp;&nbsp;+${fmt(avaliacao.pontos_prova)}<br>Presença&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+${fmt(avaliacao.pontos_presenca)}<br>Bônus da Gestão&nbsp;&nbsp;${bonus>=0?'+':''}${fmt(bonus)}</div>
        </div>
      </div>
      <div class="saldo-conta" style="margin-top:10px">Total acadêmico + bônus: <b style="color:var(--gelo)">${fmt(Math.max(0,avaliacao.pontos_total+bonus))} pts</b></div>
      `:'<div style="color:var(--cinza);text-align:center;padding:16px">Nenhuma avaliação lançada neste bimestre ainda.</div>'}

    <div class="copa-bonus-linha">
      <div class="acao" onclick="modalBonusCopa(copaAlunoPerfilAtual,'adicao', ()=>abrirPerfilAlunoGestao('${aluno.id}'))"><span class="ai"><i class="ph ph-plus"></i></span>Bônus Copa</div>
      <div class="acao" onclick="modalBonusCopa(copaAlunoPerfilAtual,'remocao', ()=>abrirPerfilAlunoGestao('${aluno.id}'))"><span class="ai"><i class="ph ph-minus"></i></span>Remover bônus</div>
    </div>`;
}

// ---------- Histórico da Copa ----------
async function renderCopaHistoricoGestao(){
  const el=document.getElementById('copaConteudo');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;color:var(--cinza);padding:20px">Carregando histórico...</div>';

  const [{data:avals},{data:bimestresFechados}]=await Promise.all([
    supabase.from('avaliacoes_alunos').select('*, aluno:aluno_id(usuario)').order('created_at',{ascending:false}).limit(30),
    supabase.from('bimestres').select('*').eq('status','fechado').order('numero',{ascending:false})
  ]);

  el.innerHTML=`
    <div class="painel" style="margin-bottom:18px">
      <div class="painel-h" style="display:flex;justify-content:space-between;align-items:center">
        <span>Bimestres encerrados</span>
        <button class="btn-form" style="width:auto;padding:9px 18px;margin-top:0;background:rgba(239,68,68,.15);color:#fca5a5" onclick="confirmarFecharBimestre()">Fechar bimestre atual</button>
      </div>
      ${(bimestresFechados||[]).length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhum bimestre encerrado ainda.</div>':
        (bimestresFechados||[]).map(b=>`
        <div class="ext-item"><div class="ext-ic ic-n"><svg class="copa-shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/></svg></div>
          <div class="ext-info"><div class="ext-desc">${b.numero}º Bimestre — Campeã: ${b.turma_campea||'—'}</div>
          <div class="ext-data">Pontuação: ${fmt(b.pontuacao_campea||0)} · Encerrado em ${b.data_fechamento?new Date(b.data_fechamento).toLocaleDateString('pt-BR'):'—'}</div></div>
        </div>`).join('')}
    </div>
    <div class="painel">
      <div class="painel-h">Últimas avaliações lançadas</div>
      ${(avals||[]).length===0?'<div style="color:var(--cinza);text-align:center;padding:20px">Nenhuma avaliação registrada ainda.</div>':
        (avals||[]).map(a=>`
        <div class="admin-hist-item">
          <div class="admin-hist-top"><span>${a.aluno?.usuario||'—'} — Turma ${a.turma_nome}</span><span class="admin-hist-data">${new Date(a.created_at).toLocaleString('pt-BR')}</span></div>
          <div class="admin-hist-motivo">Tarefas SP: ${a.tarefas_sp}% · Prova Paulista: ${a.prova_paulista}% · Presença: ${a.presenca}%</div>
          <div class="admin-hist-meta">Pontos gerados: ${fmt(a.pontos_total)} · Bimestre: ${a.bimestre}</div>
        </div>`).join('')}
    </div>`;
}

function confirmarFecharBimestre(){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  if(!copaBimestreAtual) return notif('Nenhum bimestre aberto no momento.','erro');
  modal('Fechar bimestre',
    `<div style="color:var(--cinza);font-size:.85rem;line-height:1.6">
      Isso vai congelar a classificação do <b>${copaBimestreAtual.numero}º bimestre</b>, registrar a turma campeã
      e abrir um novo bimestre. Os dados anteriores não são apagados. Deseja continuar?
    </div>`,
    async ()=>{ await fecharBimestreCopa(); fecharModal(); },false);
}

async function fecharBimestreCopa(){
  const turmas=await carregarTurmas();
  const ordenado=[...turmas].sort((a,b)=>b.pontuacao-a.pontuacao);
  const campea=ordenado[0];

  const {error:erroUpd}=await supabase.from('bimestres').update({
    status:'fechado', turma_campea:campea?campea.nome:null, pontuacao_campea:campea?campea.pontuacao:0,
    data_fechamento:new Date().toISOString()
  }).eq('id',copaBimestreAtual.id);
  if(erroUpd){ console.error(erroUpd); return notif('Erro ao encerrar bimestre: '+erroUpd.message,'erro'); }

  const novoNumero=copaBimestreAtual.numero+1;
  const {error:erroIns}=await supabase.from('bimestres').insert({numero:novoNumero,status:'aberto'});
  if(erroIns){ console.error(erroIns); return notif('Erro ao abrir novo bimestre: '+erroIns.message,'erro'); }

  await supabase.from('turmas').update({pontuacao:0}).neq('id','00000000-0000-0000-0000-000000000000');
  gestaoTurmas.forEach(t=>t.pontuacao=0);

  copaBimestreAtual=null;
  await carregarBimestreAtual();
  notif(`Bimestre encerrado! Campeã: ${campea?campea.nome:'—'} <i class="ph ph-trophy"></i>`);
  renderCopaHistoricoGestao();
}

// ---------- Configurações ----------
function renderCopaConfigGestao(){
  const el=document.getElementById('copaConteudo');
  if(!el) return;
  el.innerHTML=`
    <div class="painel" style="max-width:520px">
      <div class="painel-h">Conversão de notas em pontos</div>
      <div style="color:var(--cinza);font-size:.78rem;margin-bottom:14px">Defina quantos pontos valem 100% em cada critério. Os pontos são calculados automaticamente e de forma proporcional.</div>
      <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Tarefas SP — 100% =</label>
      <input id="cfgTarefas" class="inp" type="number" value="${copaConfigPesos.peso_tarefas}">
      <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Prova Paulista — 100% =</label>
      <input id="cfgProva" class="inp" type="number" value="${copaConfigPesos.peso_prova}">
      <label style="font-size:.82rem;color:var(--cinza);display:block;margin-bottom:6px">Presença — 100% =</label>
      <input id="cfgPresenca" class="inp" type="number" value="${copaConfigPesos.peso_presenca}" style="margin-bottom:16px">
      <button class="btn-form btn-azul" onclick="salvarCopaConfig()">Salvar configuração</button>
    </div>`;
}

async function salvarCopaConfig(){
  if(!isGestao()) return notif('Acesso restrito à Gestão!','erro');
  const peso_tarefas=Number(document.getElementById('cfgTarefas').value);
  const peso_prova=Number(document.getElementById('cfgProva').value);
  const peso_presenca=Number(document.getElementById('cfgPresenca').value);
  if([peso_tarefas,peso_prova,peso_presenca].some(v=>isNaN(v)||v<0)) return notif('Valores inválidos!','erro');

  const {error}=await supabase.from('copa_config').update({peso_tarefas,peso_prova,peso_presenca}).eq('id',1);
  if(error){ console.error(error); return notif('Erro ao salvar: '+error.message,'erro'); }
  copaConfigPesos={peso_tarefas,peso_prova,peso_presenca};
  notif('Configuração salva!');
}

// ---------- Visão do aluno ----------
async function renderCopaAluno(){
  const el=document.getElementById('mainConteudo');
  el.innerHTML='<div style="text-align:center;color:var(--cinza);padding:30px">Carregando Copa das Salas...</div>';

  const minhaTurmaNome=usuarios[logado].turma;
  if(!minhaTurmaNome){
    el.innerHTML=`
      <div class="pg-header"><div><div class="pg-titulo">Copa das Salas</div><div class="pg-sub">Competição entre as turmas</div></div></div>
      <div class="painel" style="text-align:center;padding:40px;color:var(--cinza)">Você ainda não está vinculado a uma turma. Fale com a Gestão da sua escola.</div>`;
    return;
  }

  await Promise.all([carregarBimestreAtual(),carregarTurmas()]);
  const bimestreNum=copaBimestreAtual?copaBimestreAtual.numero:1;
  const ordenado=[...gestaoTurmas].sort((a,b)=>b.pontuacao-a.pontuacao);
  const posicao=ordenado.findIndex(t=>t.nome===minhaTurmaNome)+1;
  const minhaTurma=ordenado.find(t=>t.nome===minhaTurmaNome);
  const {avaliacao}=await calcularPontosIndividuais(usuarios[logado].id,bimestreNum);

  el.innerHTML=`
    <div class="pg-header">
      <div><div class="pg-titulo"><svg class="copa-shield-icon" style="width:22px;height:22px;vertical-align:-4px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"/></svg> Copa das Salas</div>
      <div class="pg-sub">${bimestreNum}º bimestre em andamento</div></div>
    </div>
    <div class="card-saldo" style="margin-bottom:20px">
      <div class="saldo-label">Minha turma</div>
      <div class="saldo-valor" style="font-size:1.6rem">${minhaTurmaNome}</div>
      <div class="saldo-conta">Posição atual: ${posicao>0?posicao+'º lugar':'—'} · ${fmt(minhaTurma?minhaTurma.pontuacao:0)} pts</div>
    </div>
    ${avaliacao?`
    <div class="painel" style="margin-bottom:20px">
      <div class="painel-h">Meu desempenho acadêmico</div>
      <table class="copa-crit-table">
        <thead><tr><th>Critério</th><th>Resultado</th></tr></thead>
        <tbody>
          <tr><td>Tarefas SP</td><td>${avaliacao.tarefas_sp}%</td></tr>
          <tr><td>Prova Paulista</td><td>${avaliacao.prova_paulista}%</td></tr>
          <tr><td>Presença</td><td>${avaliacao.presenca}%</td></tr>
        </tbody>
      </table>
    </div>`:'<div class="painel" style="margin-bottom:20px;text-align:center;color:var(--cinza);padding:20px">Sua avaliação deste bimestre ainda não foi lançada.</div>'}
    <div class="painel">
      <div class="painel-h">Ranking geral das turmas</div>
      <div class="copa-ranking-lista">
        ${ordenado.map((t,i)=>{
          const pos=i+1;
          return `<div class="copa-ranking-item ${pos<=3?'pos-'+pos:''}" ${t.nome===minhaTurmaNome?'style="outline:1px solid var(--azul)"':''}>
            <div class="copa-pos-badge ${pos<=3?'md-'+pos:''}">${pos}º</div>
            <div class="copa-ranking-info"><div class="copa-ranking-nome">${t.nome}${pos<=3?medalhaSvg(pos):''}</div></div>
            <div class="copa-ranking-pts">${fmt(t.pontuacao)} pts</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ============ ENTER ============
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter') return;
  if(!document.getElementById('telaLogin').classList.contains('hidden')) login();
  if(!document.getElementById('telaCadastro').classList.contains('hidden')) cadastrar();
  if(!document.getElementById('modalBg').classList.contains('hidden')&&_modalCb) _modalCb();
});
