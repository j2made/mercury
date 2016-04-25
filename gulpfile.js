
// CONFIG VARS
devURL = 'virtual-host.dev';


// GULP PLUGINS
var gulp = require('gulp');
var browserSync = require('browser-sync');
var pngcrush = require('imagemin-pngcrush');
var args = require('yargs').argv;
var mainBowerFiles = require('main-bower-files');
var jshint = require('gulp-jshint');
var glp = require('gulp-load-plugins')();


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
gulp.task('build_html', function(){
  gulp.src('index.html')
  .pipe( glp.htmlReplace({
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
 * Build backup Jquery file
 */
// jQuery
gulp.task('build_jquery', function() {
  gulp.src('./node-modules/jquery/dist/jquery.js')
    .pipe(glp.uglify())
    .pipe(glp.rename('jquery.min.js'))
    .pipe(gulp.dest(production_path))
});




/**
 * SCRIPTS TASK
 *
 * Create `main.js` file. If `--production` arg is passed,
 * a minified file will be created in `/src`
 */
gulp.task('build_scripts', ['js_lint_task'], function() {

  // Get all Bower js files.
  var jsFiles = mainBowerFiles('**/*.js');
  jsFiles.push( path + 'scripts/**/!(main)*.js' );
  jsFiles.push( path + 'scripts/main.js' );

  // Start Gulp tasks
  gulp.src(jsFiles)
    .pipe( glp.if( env.dev, glp.plumber()) )
    .pipe( glp.if( env.dev, glp.sourcemaps.init() ) )
      .pipe(glp.concat('main' + minExtension + '.js'))
    .pipe( glp.if( env.dev, glp.sourcemaps.write() ) )

    // Run --production to generate minified files
    .pipe( glp.if( env.production, glp.uglify()) )
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
gulp.task('build_sass', function() {
  gulp.src(path + 'styles/main.scss')
    .pipe( glp.if( env.dev, glp.plumber()) )
    .pipe( glp.if( env.dev, glp.sourcemaps.init() ) )
      .pipe(glp.sass({ errLogToConsole: true }))
      .pipe(glp.autoprefixer({
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      }))
      .pipe( glp.rename('styles' + minExtension + '.css') )
    .pipe( glp.if( env.dev, glp.sourcemaps.write() ) )
    .pipe( glp.if( env.dev, gulp.dest(destination_path)) )
    .pipe( browserSync.stream({match: '**/*.css'}) )

    // Run --production to generate minified files
    .pipe( glp.if( env.production, glp.minifyCss({sourceMap: false})) )
    .pipe( glp.if( env.production, gulp.dest(destination_path)) );
});



/**
 * IMAGE TASK
 *
 * Process images and minify nicely.
 * Minify SVGs just a bit
 */
gulp.task('build_images', function() {
  return gulp.src(path + 'img/*')
    .pipe(glp.imagemin({
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
gulp.task('js_watch', ['js_lint_task', 'build_scripts'], browserSync.reload);


/**
 * Default Gulp Task
 * Scripts, Styles, Images
 */
gulp.task('default', ['build_scripts', 'build_sass', 'build_images', 'build_html']);


/**
 * Build Task
 *
 * Run when first installing.
 * Build Tasks, Scripts, Styles, Images, HTML Source
 */
gulp.task('build', [
  'build_jquery',
  'build_scripts',
  'build_sass',
  'build_images',
  'build_html'
]);



/**
 * SERVE TASK
 *
 * Initializes Browsersync
 */
gulp.task('serve', ['build_html'], function() {
  browserSync.init({
      proxy: devURL
  });

  gulp.watch([path + 'styles/**/*'], ['build_sass']);
  gulp.watch([path + 'scripts/**/*'], ['js_watch']);
  gulp.watch([path + 'img/**/*'], ['build_images']);
  gulp.watch(['**/*.php', '**/*.html']).on('change', browserSync.reload);
});