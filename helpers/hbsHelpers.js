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

    hbs.registerHelper('isActive', (index) => {
      return index === 0 ? 'active' : '';
    });
  
    // Helper to construct the tab ID
    hbs.registerHelper('tabId', (index) => {
      return `tabs-${index}`;
    });

    hbs.registerHelper('imagePath', (image) => {
      return `/uploads/re-image/${image}`;
    })

    hbs.registerHelper('or', (arg1, arg2) => {
      return arg1 || arg2;
    });
}


module.exports = registerHelpers