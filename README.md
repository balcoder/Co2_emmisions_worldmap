# NPM Scripts

This is a simple npm script based build tool to build simple web apps. It has some sample files and sass to test the build process.

To get up and running install the required packages:

You will need to have live-server installed globally

```
npm install -g live-server
```

Then install all the package dependencies

```
npm install
```

We use onchange to check for changes in the scss and js files, if using windows machine the npm script needs modification which I've already done (NOTE: Windows users may need to use double quotes rather than single quotes. If used in an npm script, remember to escape the double quotes.)

"watch:css": "onchange `\"`assets/scss/\_.scss`\"` -- npm run scss:dev",

"watch:js": "onchange `\"`assets/js/\_.js`\"` -- npm run js:dev",

For Development run `npm run watch` , which

1. watches for changes in assets/scss/\*.scss and converts scss to css and adds to css/style.css
2. watches for changes in assets/js/\*.js concats test1.js and test2.js and adds to main.js

For Production run `npm run build`, which

1. Creates production ready css in dist/css
2. Creates production ready js in dist/js
3. Creates compressed images in dist/img
4. Modifies index.html links to css and js in dist folder
