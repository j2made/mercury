// GULP PLUGINS
var gulp = require('gulp');
var browserSync = require('browser-sync');
var pngcrush = require('imagemin-pngcrush');
var args = require('yargs').argv;
var mainBowerFiles = require('main-bower-files');
var jshint = require('gulp-jshint');
var $ = require('gulp-load-plugins')();


// DIR AND PATH VARS
var path = './assets/';                   // Path to base assets
var destination_path = './src/';          // Path to non-production directory
var production_path = './dist/'           // Path to production direrctory
var bower_path = './bower_components/'    // Path to Bower files
var minExtension = '';                    // Unminified file extension

var env = {
  production: args.production,            // If production flag is passed
  dev: !args.production                   // Default (no flag)
}

if(env.production) {
  var minExtension = '.min';              // Minified file extension
  var destination_path = production_path; // Change path to production dir
}


/**
 * JS LINT TASK
 *
 * Lint using jshint, stylish output.
 */
gulp.task('js_lint_task', function(){
  return gulp.src(path + 'scripts/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish-source'));
});


/**
 * HTML SOURCE TASK
 *
 * Output the proper css file in the head
 */
gulp.task('html_src_task', function(){
  gulp.src('index.html')
  .pipe( $.htmlReplace({
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
 * BUILD TASKS
 *
 * Build Modernizr.js and Jquery.js files
 */
gulp.task('build_modernizr', function() {
  gulp.src(bower_path + '/modernizr/modernizr.js')
    .pipe($.uglify())
    .pipe($.rename('modernizr-2.8.3.min.js'))
    .pipe(gulp.dest(production_path))
});
// jQuery
gulp.task('build_jquery', function() {
  gulp.src(bower_path + '/jQuery/dist/jquery.js')
    .pipe($.uglify())
    .pipe($.rename('jquery.min.js'))
    .pipe(gulp.dest(production_path))
});






/**
 * SCRIPTS TASK
 *
 * Create `main.js` file. If `--production` arg is passed,
 * a minified file will be created in `/src`
 */
gulp.task('scripts_task', ['js_lint_task'], function() {

  // Get all Bower js files.
  var jsFiles = mainBowerFiles('**/*.js');
  jsFiles.push( path + 'scripts/**/!(main)*.js' );
  jsFiles.push( path + 'scripts/main.js' );

  // Start Gulp tasks
  gulp.src(jsFiles)
    .pipe( $.if( env.dev, $.plumber()) )
    .pipe( $.if( env.dev, $.sourcemaps.init() ) )
      .pipe($.concat('main' + minExtension + '.js'))
    .pipe( $.if( env.dev, $.sourcemaps.write() ) )

    // Run --production to generate minified files
    .pipe( $.if( env.production, $.uglify()) )
    .pipe( gulp.dest(destination_path) );

});


/**
 * STYLES TASK
 *
 * Convert SASS to CSS
 *
 * Create `styles.css` file. If `--production` arg is passed,
 * a minified file will be created in `/dist`
 */
gulp.task('style_task', function() {
  gulp.src(path + 'styles/main.scss')
    .pipe( $.if( env.dev, $.plumber()) )
    .pipe( $.if( env.dev, $.sourcemaps.init() ) )
      .pipe($.sass({ errLogToConsole: true }))
      .pipe($.autoprefixer({
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      }))
      .pipe( $.rename('styles' + minExtension + '.css') )
    .pipe( $.if( env.dev, $.sourcemaps.write() ) )
    .pipe( $.if( env.dev, gulp.dest(destination_path)) )
    .pipe(browserSync.stream())

    // Run --production to generate minified files
    .pipe( $.if( env.production, $.minifyCss({sourceMap: false})) )
    .pipe( $.if( env.production, gulp.dest(destination_path)) );
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
    .pipe(gulp.dest(production_path + 'images'));
});


/**
 * JS WATCH TASK
 *
 * Runs on Serve Task, runs lint and scripts task, reloads page.
 */
gulp.task('js_watch', ['js_lint_task', 'scripts_task'], browserSync.reload);


/**
 * Default Gulp Task
 * Scripts, Styles, Images
 */
gulp.task('default', ['scripts_task', 'style_task', 'image_task', 'html_src_task']);


/**
 * Build Task
 *
 * Run when first installing.
 * Build Tasks, Scripts, Styles, Images, HTML Source
 */
gulp.task('build', [
  'build_modernizr',
  'build_jquery',
  'scripts_task',
  'style_task',
  'image_task',
  'html_src_task'
]);



/**
 * SERVE TASK
 *
 * Initializes Browsersync
 */
gulp.task('serve', function() {
  browserSync.init({
      proxy: "CONFIG_THIS"
  });

  gulp.watch([path + 'styles/**/*'], ['style_task']);
  gulp.watch([path + 'scripts/**/*'], ['js_watch']);
  gulp.watch([path + 'img/**/*'], ['image_task']);
  gulp.watch(['**/*.php', '**/*.html']).on('change', browserSync.reload);
});