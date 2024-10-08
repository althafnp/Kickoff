const hbs = require('hbs')


const registerHelpers = () => {
    hbs.registerHelper('eq', (a, b) => a == b);
    
    hbs.registerHelper('subtract', (a, b) =>  a - b);
    
    hbs.registerHelper('add', (a, b) => a + b);
    
    hbs.registerHelper('range', (start, end) => {
      const result = [];
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
      return result;
    });

    hbs.registerHelper('gt', (a, b) => a > b);

    hbs.registerHelper('lt', (a, b) => a < b);

    hbs.registerHelper('ifEquals',  (a, b, options) => 
        a === b ? options.fn(this) : options.inverse(this)
    );

    hbs.registerHelper('json', context => JSON.stringify(context));

    hbs.registerHelper('formatDate',  date =>
        new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    );

    hbs.registerHelper('toFixed', (number, decimals) => number.toFixed(decimals));
}


module.exports = registerHelpers