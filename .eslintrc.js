module.exports = {

  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },

  "parserOptions": {
    "ecmaVersion": 8,
    "sourceType": "module"
  },

  "extends": ["eslint:recommended", "prettier"],

  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "max-len": ["error", { "code": 100 }],
    "no-console": ["error", { "allow": ["info", "warn", "error"] }],
    "no-multi-spaces": ["error", { "ignoreEOLComments": true }],
    "no-trailing-spaces": ["error", { "skipBlankLines": true, "ignoreComments": true }],
    "no-underscore-dangle": "off",
    "quote-props": ["error", "as-needed"],
    "quotes": ["error", "double", {"avoidEscape":  true, "allowTemplateLiterals": true}],
    "semi": ["error", "always"]
  }

};