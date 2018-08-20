var inquirer = require('inquirer');
inquirer
    .prompt([
        /* Pass your questions in here */
        {type: 'list', name: 'choice', choices:['a', 'b']},
    ])
    .then(answers => {
        return inquirer
            .prompt([
                /* Pass your questions in here */
                {type: 'input', name: 'username'},
                {type: 'password', name: 'password'}
            ])
            .then(answers => {
                // Use user feedback for... whatever!!
                console.log(answers);
            });
    });
