# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product


!["Login Page"](https://github.com/shadeemerhi/tinyapp/blob/master/docs/login_page.png)
!["Short URL's Page"](https://github.com/shadeemerhi/tinyapp/blob/master/docs/urls_page.png)
!["Create New URL Page"](https://github.com/shadeemerhi/tinyapp/blob/master/docs/new_page.png)
!["View and Edit URL Page"](https://github.com/shadeemerhi/tinyapp/blob/master/docs/view_edit_page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- dotenv

## Getting Started

- Install all dependencies (using the `npm install` command).
- Create a .env file and store all cookieSession keys as variables.
  - In express_server.js, store the key(s) in variable(s) (i.e. `const keyKey = process.env.myKey`).
  - Use the key(s) in the cookieSession object when configuring Express (`app.use(cookieSession({name: 'session', keys: [myKey]}))`
- Run the development web server using the `node express_server.js` command.
