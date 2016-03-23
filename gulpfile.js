const gulp = require('gulp')
const merge = require('merge-stream')
const buffer = require('vinyl-buffer')
const source = require('vinyl-source-stream')
const del = require('del')
const nunjucksRender = require('gulp-nunjucks-render')
const autoprefixer = require('gulp-autoprefixer')
const concat = require('gulp-concat')
const browserify = require('browserify')
const htmlmin = require('gulp-htmlmin')
const cssnano = require('gulp-cssnano')
const uglify = require('gulp-uglify')

const DESKTOP_SIGN_IN_CSS_SOURCES = [
  './src/css/material.css',
  './src/css/signIn.css'
]

const DESKTOP_APP_CSS_SOURCES = [
  './src/css/material.css',
  './src/css/app.css'
]

const MOBILE_APP_CSS_SOURCES = [
  './src/css/material.css',
  './src/css/app.css'
]

const AUTOPREFIXER_BROWSERS = [
  'iOS >= 7',
  'Android >= 4',
  'ChromeAndroid >= 40',
  'FirefoxAndroid >= 40'
]

// DEFAULT
gulp.task('default', () => {
  gulp.watch('src/html/**', ['html_dev'])
  gulp.watch('src/css/**', ['css_dev'])
  gulp.watch(['src/js/common/**', 'src/js/desktop/**'], ['jsSignIn_dev', 'jsDesktopApp_dev'])
  gulp.watch(['src/js/common/**', 'src/js/mobile/**'], ['jsMobileApp_dev'])
  gulp.watch('src/fonts/**', ['fonts'])
  gulp.watch('src/icons/**', ['icons'])
  gulp.watch('src/js/background.js', ['backgroundJS'])
  gulp.watch('src/manifest.json', ['appManifest'])
  gulp.watch('src/img/**', ['img'])
  gulp.watch('src/_locales/**', ['locales'])
  gulp.watch('src/checkFile', ['checkFile'])
})

// RELEASE
gulp.task('release_dev', ['html_dev', 'css_dev', 'jsSignIn_dev', 'jsDesktopApp_dev', 'jsMobileApp_dev',
'fonts', 'icons', 'backgroundJS', 'appManifest', 'img', 'locales', 'checkFile'])

gulp.task('release_prod', ['html_prod', 'css_prod', 'jsSignIn_prod', 'jsDesktopApp_prod', 'jsMobileApp_prod',
'fonts', 'icons', 'backgroundJS', 'appManifest', 'img', 'locales', 'checkFile'])

gulp.task('deleteRelease', () => {
  return del(['../BrightCastRelease/**'], {'force': true})
})

// HTML
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
    .pipe(gulp.dest('../BrightCastRelease'))

  let mobile = gulp.src('./src/html/pages/mobileApp.html')
    .pipe(nunjucksRender())
    .pipe(gulp.dest('../BrightCastRelease/public'))

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
    .pipe(gulp.dest('../BrightCastRelease'))

  let mobile = gulp.src('./src/html/pages/mobileApp.html')
    .pipe(nunjucksRender())
    .pipe(htmlmin({
      'removeComments': true,
      'collapseWhitespace': true
    }))
    .pipe(gulp.dest('../BrightCastRelease/public'))

  return merge(desktop, mobile)
})

// CSS
gulp.task('css_dev', () => {
  'use strict'

  let desktopApp = gulp.src(DESKTOP_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(gulp.dest('../BrightCastRelease'))
  let mobileApp = gulp.src(MOBILE_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(autoprefixer({
      'browsers': AUTOPREFIXER_BROWSERS
    }))
    .pipe(gulp.dest('../BrightCastRelease/public'))
  let desktopSignIn = gulp.src(DESKTOP_SIGN_IN_CSS_SOURCES)
    .pipe(concat('signIn.css'))
    .pipe(gulp.dest('../BrightCastRelease'))

  return merge(desktopApp, mobileApp, desktopSignIn)
})

gulp.task('css_prod', () => {
  'use strict'

  let desktopApp = gulp.src(DESKTOP_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('../BrightCastRelease'))
  let mobileApp = gulp.src(MOBILE_APP_CSS_SOURCES)
    .pipe(concat('app.css'))
    .pipe(autoprefixer({
      'browsers': AUTOPREFIXER_BROWSERS
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('../BrightCastRelease/public'))
  let desktopSignIn = gulp.src(DESKTOP_SIGN_IN_CSS_SOURCES)
    .pipe(concat('signIn.css'))
    .pipe(cssnano())
    .pipe(gulp.dest('../BrightCastRelease'))

  return merge(desktopApp, mobileApp, desktopSignIn)
})

// JS_dev
gulp.task('jsSignIn_dev', () => {
  var b = browserify({
    entries: './src/js/desktop/signIn.js'
  })

  return b.bundle()
    .pipe(source('signIn.js'))
    .pipe(buffer())
    .pipe(gulp.dest('../BrightCastRelease'))
})

gulp.task('jsDesktopApp_dev', () => {
  var b = browserify({
    entries: './src/js/desktop/app.js'
  })

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('../BrightCastRelease'))
})

gulp.task('jsMobileApp_dev', () => {
  var b = browserify({
    entries: './src/js/mobile/app.js'
  })

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('../BrightCastRelease/public'))
})

// JS_prod
gulp.task('jsSignIn_prod', () => {
  var b = browserify({
    entries: './src/js/desktop/signIn.js'
  })

  return b.bundle()
    .pipe(source('signIn.js'))
    .pipe(buffer())
    .pipe(uglify({'mangle': false}))
    .pipe(gulp.dest('../BrightCastRelease'))
})

gulp.task('jsDesktopApp_prod', () => {
  var b = browserify({
    entries: './src/js/desktop/app.js'
  })

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(uglify({'mangle': false}))
    .pipe(gulp.dest('../BrightCastRelease'))
})

gulp.task('jsMobileApp_prod', () => {
  var b = browserify({
    entries: './src/js/mobile/app.js'
  })

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(uglify({'mangle': false}))
    .pipe(gulp.dest('../BrightCastRelease/public'))
})

// FONTS
gulp.task('fonts', () => {
  'use strict'

  let desktop = gulp.src('src/fonts/desktop/**/*', {
    base: 'src'
  }).pipe(gulp.dest('../BrightCastRelease'))
  let mobile = gulp.src('src/fonts/mobile/**/*', {
    base: 'src'
  }).pipe(gulp.dest('../BrightCastRelease/public'))

  return merge(desktop, mobile)
})

// ICONS
gulp.task('icons', () => {
  'use strict'

  let desktop = gulp.src([
    'src/icons/desktop/icon16.png',
    'src/icons/desktop/icon48.png',
    'src/icons/desktop/icon128.png',
    'src/icons/broadcast.svg'
  ])
    .pipe(gulp.dest('../BrightCastRelease/icons'))

  let mobile = gulp.src([
    'src/icons/mobile/apple-touch-icon-60x60.png',
    'src/icons/mobile/apple-touch-icon-76x76.png',
    'src/icons/mobile/apple-touch-icon-120x120.png',
    'src/icons/mobile/apple-touch-icon-152x152.png',
    'src/icons/mobile/apple-touch-icon-180x180.png',
    'src/icons/broadcast.svg'
  ])
    .pipe(gulp.dest('../BrightCastRelease/public/icons'))

  let favicon = gulp.src('src/icons/mobile/favicon.ico')
    .pipe(gulp.dest('../BrightCastRelease/public'))

  return merge(desktop, mobile, favicon)
})

// BACKGROUND_JS
gulp.task('backgroundJS', () => {
  return gulp.src('src/js/background.js')
    .pipe(gulp.dest('../BrightCastRelease'))
})

// MANIFEST
gulp.task('appManifest', () => {
  return gulp.src('src/manifest.json')
    .pipe(gulp.dest('../BrightCastRelease'))
})

// IMGS
gulp.task('img', () => {
  'use strict'

  let desktop = gulp.src([
    'src/img/drawer-header-bg.jpg',
    'src/img/sign-in-page-bg.jpg'
  ])
    .pipe(gulp.dest('../BrightCastRelease/img'))

  let mobile = gulp.src([
    'src/img/drawer-header-bg.jpg'
  ])
    .pipe(gulp.dest('../BrightCastRelease/public/img'))

  return merge(desktop, mobile)
})

// LOCALES
gulp.task('locales', () => {
  'use strict'

  let desktop = gulp.src(['./src/_locales/**/*'])
    .pipe(gulp.dest('../BrightCastRelease/_locales'))

  let mobile = gulp.src(['./src/_locales/**/*'])
    .pipe(gulp.dest('../BrightCastRelease/public/_locales'))

  return merge(desktop, mobile)
})

// CHECK-FILE
gulp.task('checkFile', () => {
  return gulp.src('src/check')
    .pipe(gulp.dest('../BrightCastRelease/public'))
})
