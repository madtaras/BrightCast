const gulp = require('gulp')
const merge = require('merge-stream')

const nunjucksRender = require('gulp-nunjucks-render')
const concat = require('gulp-concat')
const autoprefixer = require('gulp-autoprefixer')
const del = require('del')

const htmlmin = require('gulp-htmlmin')
const cssnano = require('gulp-cssnano')
const uglify = require('gulp-uglify')

gulp.task('default', () => {
  gulp.watch('src/html/**', ['html_dev'])
  gulp.watch('src/css/**', ['css_dev'])
  gulp.watch('src/js/**', ['js_dev'])
  gulp.watch('src/fonts/**', ['fonts'])
  gulp.watch('src/icons/**', ['icons'])
  gulp.watch('src/js/background.js', ['backgroundJS'])
  gulp.watch('src/manifest.json', ['appManifest'])
  gulp.watch('src/img/**', ['img'])
  gulp.watch('src/_locales/**', ['locales'])
})

gulp.task('release_dev', ['html_dev', 'css_dev', 'js_dev', 'fonts', 'icons', 'backgroundJS', 'appManifest', 'img', 'locales'])
gulp.task('release_prod', ['html_prod', 'css_prod', 'js_prod', 'fonts', 'icons', 'backgroundJS', 'appManifest', 'img', 'locales'])

gulp.task('cleanReleaseFolder', () => {
  return del(['release/**'])
})

gulp.task('html_dev', () => {
  'use strict'
  nunjucksRender.nunjucks.configure(['./src/html/templates/'], {
    'tags': {
      'variableStart': '<$',
      'variableEnd': '$>'
    },
    'watch': false
  })

  let desktop = gulp.src(['./src/html/pages/desktopApp.html', './src/html/pages/desktopSignIn.html'])
    .pipe(nunjucksRender())
    .pipe(gulp.dest('./release'))

  let mobile = gulp.src('./src/html/pages/mobileApp.html')
    .pipe(nunjucksRender())
    .pipe(gulp.dest('./release/public'))

  return merge(desktop, mobile)
})

gulp.task('html_prod', () => {
  'use strict'
  nunjucksRender.nunjucks.configure(['./src/html/templates/'], {
    'tags': {
      'variableStart': '<$',
      'variableEnd': '$>'
    },
    'watch': false
  })

  let desktop = gulp.src(['./src/html/pages/desktopApp.html', './src/html/pages/desktopSignIn.html'])
    .pipe(nunjucksRender())
    .pipe(htmlmin({
      'removeComments': true,
      'collapseWhitespace': true
    }))
    .pipe(gulp.dest('./release'))

  let mobile = gulp.src('./src/html/pages/mobileApp.html')
    .pipe(nunjucksRender())
    .pipe(htmlmin({
      'removeComments': true,
      'collapseWhitespace': true
    }))
    .pipe(gulp.dest('./release/public'))

  return merge(desktop, mobile)
})

const AUTOPREFIXER_BROWSERS = [
  'iOS >= 7',
  'Android >= 4',
  'ChromeAndroid >= 40',
  'FirefoxAndroid >= 40'
]

const DESKTOP_APP_CSS_SOURCES = [
  './src/css/material.css',
  './src/css/app.css'
]

const MOBILE_APP_CSS_SOURCES = [
  './src/css/material.css',
  './src/css/app.css'
]

const DESKTOP_SIGN_IN_CSS_SOURCES = [
  './src/css/material.css',
  './src/css/signIn.css'
]

gulp.task('css_dev', () => {
  'use strict'

  let desktopApp = gulp.src(DESKTOP_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(gulp.dest('./release'))
  let mobileApp = gulp.src(MOBILE_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(autoprefixer({
      'browsers': AUTOPREFIXER_BROWSERS
    }))
    .pipe(gulp.dest('./release/public'))
  let desktopSignIn = gulp.src(DESKTOP_SIGN_IN_CSS_SOURCES)
    .pipe(concat('signIn.css'))
    .pipe(gulp.dest('./release'))

  return merge(desktopApp, mobileApp, desktopSignIn)
})

gulp.task('css_prod', () => {
  'use strict'

  let desktopApp = gulp.src(DESKTOP_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('./release'))
  let mobileApp = gulp.src(MOBILE_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(autoprefixer({
      'browsers': AUTOPREFIXER_BROWSERS
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('./release/public'))
  let desktopSignIn = gulp.src(DESKTOP_SIGN_IN_CSS_SOURCES)
    .pipe(concat('signIn.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('./release'))

  return merge(desktopApp, mobileApp, desktopSignIn)
})

const DESKTOP_APP_JS_SOURCES = [
  './src/js/common/material.js',
  './src/js/common/slideout.min.js',
  './src/js/common/appHelpfulModules.js',
  './src/js/common/mutation-summary.js',
  './src/js/common/arrive.min.js',
  './src/js/common/jets.min.js',
  './src/js/desktop/sha1.js',
  './src/js/desktop/http.js',
  './src/js/desktop/qr.js',
  './src/js/common/appRouter.js',
  './src/js/desktop/vkRequest.js',
  './src/js/common/mustache.min.js',
  './src/js/common/domManipulations.js',
  './src/js/desktop/app.js',
  './src/js/desktop/appInit.js'
]

const MOBILE_APP_JS_SOURCES = [
  './src/js/common/material.js',
  './src/js/common/slideout.min.js',
  './src/js/common/jets.min.js',
  './src/js/common/mutation-summary.js',
  './src/js/common/arrive.min.js',
  './src/js/common/mustache.min.js',
  './src/js/common/appRouter.js',
  './src/js/common/domManipulations.js',
  './src/js/mobile/app.js'
]

const DESKTOP_SIGN_IN_JS_SOURCES = [
  './src/js/common/material.js',
  './src/js/desktop/signIn.js'
]

gulp.task('js_dev', () => {
  'use strict'

  let desktopApp = gulp.src(DESKTOP_APP_JS_SOURCES)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./release'))
  let mobileApp = gulp.src(MOBILE_APP_JS_SOURCES)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./release/public'))
  let desktopSignIn = gulp.src(DESKTOP_SIGN_IN_JS_SOURCES)
    .pipe(concat('signIn.js'))
    .pipe(gulp.dest('./release'))

  return merge(desktopApp, mobileApp, desktopSignIn)
})

gulp.task('js_prod', () => {
  'use strict'

  let desktopApp = gulp.src(DESKTOP_APP_JS_SOURCES)
    .pipe(concat('app.js'))
    .pipe(uglify({'mangle': false}))
    .pipe(gulp.dest('./release'))
  let mobileApp = gulp.src(MOBILE_APP_JS_SOURCES)
    .pipe(concat('app.js'))
    .pipe(uglify({'mangle': false}))
    .pipe(gulp.dest('./release/public'))
  let desktopSignIn = gulp.src(DESKTOP_SIGN_IN_JS_SOURCES)
    .pipe(concat('signIn.js'))
    .pipe(uglify({'mangle': false}))
    .pipe(gulp.dest('./release'))

  return merge(desktopApp, mobileApp, desktopSignIn)
})

gulp.task('fonts', () => {
  'use strict'

  let desktop = gulp.src('src/fonts/desktop/**/*', {
    base: 'src'
  }).pipe(gulp.dest('./release'))
  let mobile = gulp.src('src/fonts/mobile/**/*', {
    base: 'src'
  }).pipe(gulp.dest('./release/public'))

  return merge(desktop, mobile)
})

gulp.task('icons', () => {
  'use strict'

  let desktop = gulp.src([
    'src/icons/desktop/icon16.png',
    'src/icons/desktop/icon48.png',
    'src/icons/desktop/icon128.png'
  ])
    .pipe(gulp.dest('./release/icons'))

  let mobile = gulp.src([
    'src/icons/mobile/apple-touch-icon-60x60.png',
    'src/icons/mobile/apple-touch-icon-76x76.png',
    'src/icons/mobile/apple-touch-icon-120x120.png',
    'src/icons/mobile/apple-touch-icon-152x152.png',
    'src/icons/mobile/apple-touch-icon-180x180.png',
    'src/icons/mobile/favicon.ico'
  ])
    .pipe(gulp.dest('./release/public'))

  return merge(desktop, mobile)
})

gulp.task('backgroundJS', () => {
  return gulp.src('src/js/background.js')
    .pipe(gulp.dest('./release'))
})

gulp.task('appManifest', () => {
  return gulp.src('src/manifest.json')
    .pipe(gulp.dest('./release'))
})

gulp.task('img', () => {
  'use strict'

  let desktop = gulp.src([
    'src/img/drawer-header-bg.jpg',
    'src/img/sign-in-page-bg.jpg'
  ])
    .pipe(gulp.dest('./release/img'))

  let mobile = gulp.src([
    'src/img/drawer-header-bg.jpg'
  ])
    .pipe(gulp.dest('./release/public/img'))

  return merge(desktop, mobile)
})

gulp.task('locales', () => {
  'use strict'

  let desktop = gulp.src(['./src/_locales/**/*'])
    .pipe(gulp.dest('./release/_locales'))

  let mobile = gulp.src(['./src/_locales/**/*'])
    .pipe(gulp.dest('./release/public/_locales'))

  return merge(desktop, mobile)
})
