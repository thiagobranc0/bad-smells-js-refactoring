const PRIORITY_THRESHOLD = 1000;
const USER_MAX_VISIBLE_VALUE = 500;

const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

/**
 * Regras de visibilidade por papel do usuário.
 * Papéis desconhecidos não veem nenhum item.
 */
const VISIBILITY_RULES = {
  [ROLES.ADMIN]: () => true,
  [ROLES.USER]: (item) => item.value <= USER_MAX_VISIBLE_VALUE,
};

function canView(user, item) {
  const rule = VISIBILITY_RULES[user.role];
  return rule ? rule(item) : false;
}

function isPriority(user, item) {
  return user.role === ROLES.ADMIN && item.value > PRIORITY_THRESHOLD;
}

function sumValues(items) {
  return items.reduce((total, item) => total + item.value, 0);
}

class CsvFormatter {
  header() {
    return ['ID,NOME,VALOR,USUARIO'];
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}`;
  }

  footer(total) {
    return ['', 'Total,,', `${total},,`];
  }
}

class HtmlFormatter {
  header(user) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];
  }

  row(item, user) {
    const openTag = isPriority(user, item) ? '<tr style="font-weight:bold;">' : '<tr>';
    return `${openTag}<td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }

  footer(total) {
    return ['</table>', `<h3>Total: ${total}</h3>`, '</body></html>'];
  }
}

const FORMATTERS = {
  CSV: new CsvFormatter(),
  HTML: new HtmlFormatter(),
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo (itens acima de PRIORITY_THRESHOLD saem em destaque).
   * - Users comuns só veem itens com valor <= USER_MAX_VISIBLE_VALUE.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      return '';
    }

    const visibleItems = items.filter((item) => canView(user, item));
    const total = sumValues(visibleItems);

    return [
      ...formatter.header(user),
      ...visibleItems.map((item) => formatter.row(item, user)),
      ...formatter.footer(total),
    ].join('\n');
  }
}
