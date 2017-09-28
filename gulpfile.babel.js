'use strict'

import path from 'path'
import gulp from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';
import babelify from 'babelify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer'
import vueify from 'gulp-vueify'

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('hello', function () {
  console.log('Hello Zell')
})

// Optimize images
gulp.task('images', () =>
  gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}))
);

// Copy all files at the root level (app)
gulp.task('copy', () =>
  gulp.src([
    'src/*',
    '!src/*.html',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}))
)

// Compile and automatically prefix stylesheets
gulp.task('styles', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 8',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.1',
    'bb >= 10'
  ];

  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'src/styles/**/*.scss',
    'src/styles/**/*.css'
  ])
    .pipe($.newer('.tmp/styles'))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(browserSync.reload({stream:true}))
    // Concatenate and minify styles
    .pipe($.if('*.css', $.cssnano()))
    .pipe($.size({title: 'styles'}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/styles'))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('babelfy', () => {
  return   gulp.src([
    './src/scripts/main.js',
    // Other scripts
  ])
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['es2015']
    }))
    .pipe($.concat('main.js'))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'))
});

gulp.task('browserify:dist', () => {
  return browserify({
    entries: 'src/scripts/main.js',
    debug: true
  })
    .transform(babelify.configure({
        presets : ["es2015"]
      }))
    .bundle()
    .pipe(source('main.min.js'))
    .pipe(buffer())
    .pipe($.uglify())
    .pipe(gulp.dest('./dist/scripts'));
});

gulp.task('browserify', () => {
  return browserify({
    entries: 'src/scripts/main.js',
    debug: true
  })
    .transform(babelify.configure({
      presets : ["es2015"]
    }))
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe($.uglify())
    .pipe(gulp.dest('.tmp/scripts'))
});

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
  return gulp.src('src/**/*.html')
    .pipe($.useref({
      searchPath: '{.tmp,app}',
      noAssets: true
    }))

    // Minify any HTML
    .pipe($.if('*.html', $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    })))
    // Output files
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'));
});

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

// Watch files for changes & reload
gulp.task('serve', ['browserify', 'styles'], () => {
  browserSync({
    notify: true,
    // Customize the Browsersync console logging prefix
    logPrefix: 'WSK',
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ['main', '.mdl-layout'],
    server: ['.tmp', 'src']
  });

  gulp.watch(['src/**/*.html'], reload);
  gulp.watch(['src/styles/**/*.{scss,css}'], ['styles']);
  gulp.watch(['src/scripts/**/*.js'], ['babelfy', 'browserify', reload]);
  gulp.watch(['src/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], () =>
  browserSync({
    notify: false,
    logPrefix: 'WSK',
    // Allow scroll syncing across breakpoints
    scrollElementMapping: ['main', '.mdl-layout'],
    server: 'dist'
  })
);

// Build components vue file
gulp.task('vueify', function () {
  return gulp.src('src/scripts/vue/components/**/*.vue')
    .pipe(vueify())
    .pipe(gulp.dest('./dist/scripts/vue'));
});

// Build production files, the default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    'styles',
    ['html', 'babelfy', 'browserify:dist', 'images', 'copy'],
    cb
  )
);

const jsEntities = {
  src: 'src/scripts/',
  dest: 'dist/scripts/',
  files: [
    'main.js'
  ]
};

gulp.task('vue', () => {
  jsEntities.files.forEach(entry => {
    browserify(path.join(jsEntities.src, entry), {
      debug: true,
      extensions: ['.js', '.vue'],
      transform: [
        vueify(),
        babelify.configure({ 'presets': ['es2015'] })
      ]
    })
      .bundle()
      .on('error', err => {
        console.log(err.message);
        console.log(err.stack);
      })
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(gulp.dest(jsEntities.dest));
  });
});