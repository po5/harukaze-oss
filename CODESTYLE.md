# Code Style
Keeping this simple for now. The first thing to remember is that this codebase DOES NOT use semicolons on the end of lines.

## If statements
```js
if(condition) {
    // Code
}
```

No space after `if`, first curly bracket starts on same line as condition. This applies to the following as well:
 - while
 - for
 - switch

## Variables
Unless required for scope reasons, `let` should be the preferred variable type.

## Anonymous functions
Unless required for scope, arrow functions should be used over standard anonymous functions.