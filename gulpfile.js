// GULP PLUGINS
var gulp = require('gulp');
var browserSync = require('browser-sync');
var pngcrush = require('imagemin-pngcrush');
var args = require('yargs').argv;
var gulpif = require('gulp-if');
var htmlreplace = require('gulp-html-replace');
var mainBowerFiles = require('main-bower-files');
var jshint = require('gulp-jshint');
var $ = require('gulp-load-plugins')();


// DIR VARS
var path = './assets/';
var destination_path = './src/';
var src_path = './dist/'
var minExtension = '';
var env = {
  production: args.production,
  dev: !args.production
}

if(env.production) {
  var minExtension = '.min';
  var destination_path = src_path;
}


// JS HINT - lint scripts
gulp.task('js_lint_task', function(){
  return gulp.src(path + 'scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});



/**
 * HTML SOURCE TASK
 *
 * Output the proper css file in the head
 */
gulp.task('html_src_task', function(){
  gulp.src('index.html')
  .pipe( htmlreplace({
      'css': destination_path + 'styles' + minExtension + '.css',
      'js': destination_path + 'main' + minExtension + '.js'
    },
    {
      keepBlockTags: true,
      resolvePaths: true
    })
  )
  .pipe(gulp.dest('.'));
});








/**
 * SCRIPTS TASK
 *
 * Create `main.js` file. If `--production` arg is passed,
 * a minified file will be created in `/src`
 */
gulp.task('scripts_task', ['js_lint_task'], function() {

  var jsFiles = mainBowerFiles('**/*.js');
  jsFiles.push( path + 'scripts/**/!(main)*.js' );
  jsFiles.push( path + 'scripts/main.js' );

  gulp.src(jsFiles)
    .pipe($.plumber())
    .pipe( gulpif( env.dev, $.sourcemaps.init() ) )
      .pipe($.concat('main.js'))
    .pipe( gulpif( env.dev, $.sourcemaps.write() ) )

    // Run --production to generate minified files
    .pipe( gulpif( env.production, $.uglify()) )
    .pipe( gulpif( env.production, $.rename('main.min.js')) )
    .pipe( gulp.dest(destination_path) );
});


/**
 * STYPES TASK
 *
 * Convert SASS to CSS
 *
 * Create `styles.css` file. If `--production` arg is passed,
 * a minified file will be created in `/src`
 */
gulp.task('style_task', function() {
  gulp.src(path + 'styles/main.scss')
    .pipe( gulpif( env.dev,$.plumber()) )
    .pipe( gulpif( env.dev, $.sourcemaps.init() ) )
      .pipe($.sass({ errLogToConsole: true }))
      .pipe($.autoprefixer({
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      }))
      .pipe( gulpif( env.dev, $.rename('styles.css')) )
    .pipe( gulpif( env.dev, $.sourcemaps.write() ) )
    .pipe( gulpif( env.dev, gulp.dest(destination_path)) )
    .pipe(browserSync.stream())

    // Run --production to generate minified files
    .pipe( gulpif( env.production, $.minifyCss({sourceMap: false})) )
    .pipe( gulpif( env.production, $.rename('styles.min.css')) )
    .pipe( gulpif( env.production, gulp.dest(destination_path)) );
});


/**
 * IMAGE TASK
 *
 * Process images and minify nicely.
 * Minify SVGs just a bit
 */
gulp.task('image_task', function() {
  return gulp.src(path + 'img/*')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}],
      use: [pngcrush()]
    }))
    .pipe(gulp.dest(src_path + 'images'));
});


// BROWSERSYNC
gulp.task('js-watch', ['jshint', 'scripts_task'], browserSync.reload);


// WATCH TASK
gulp.task('watch', function() {
  browserSync.init({
      proxy: "proxy.dev"
  });

  gulp.watch([path + 'styles/**/*'], ['style_task']);
  gulp.watch([path + 'scripts/**/*'], ['js-watch']);
  gulp.watch([path + 'img/**/*'], ['image_task']);
  gulp.watch(['**/*.php', '**/*.html']).on('change', browserSync.reload);
});

/**
 * Default Gulp Task
 * Scripts, Styles, Images
 */
gulp.task('default', ['scripts_task', 'style_task', 'image_task', 'html_src_task']);


/**
 * Build Task
 * Scripts, Styles, Images, HTML Source
 */
gulp.task('default', ['scripts_task', 'style_task', 'image_task', 'html_src_task']);


