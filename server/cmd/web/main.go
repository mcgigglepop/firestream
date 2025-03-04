package main

import (
	"encoding/gob"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/alexedwards/scs/v2"
	"github.com/mcgigglepop/firestream/server/internal/config"
	"github.com/mcgigglepop/firestream/server/internal/driver"
	"github.com/mcgigglepop/firestream/server/internal/handlers"
	"github.com/mcgigglepop/firestream/server/internal/helpers"
	"github.com/mcgigglepop/firestream/server/internal/models"
	"github.com/mcgigglepop/firestream/server/internal/render"
)

const portNumber = ":8080"

var app config.AppConfig
var session *scs.SessionManager
var infoLog *log.Logger
var errorLog *log.Logger

func main() {
	// Initialize application and database connection
	db, err := run()
	if err != nil {
		log.Fatal(err)
	}
	defer db.SQL.Close() // Ensure DB connection is closed on exit

	// Start the HTTP server
	log.Printf("Starting application on port %s", portNumber)
	srv := &http.Server{
		Addr:    portNumber,
		Handler: routes(&app),
	}

	// Run the server
	log.Fatal(srv.ListenAndServe())
}

// run initializes the application and database connection
func run() (*driver.DB, error) {
	// Register models for session storage
	gob.Register(models.User{})
	gob.Register(map[string]int{})

	// Define command-line flags
	inProduction := flag.Bool("production", true, "Application is in production")
	useCache := flag.Bool("cache", true, "Use template cache")
	dbHost := flag.String("dbhost", "localhost", "Database host")
	dbName := flag.String("dbname", "", "Database name")
	dbUser := flag.String("dbuser", "", "Database user")
	dbPass := flag.String("dbpass", "password", "Database password")
	dbPort := flag.String("dbport", "5433", "Database port")
	dbSSL := flag.String("dbssl", "disable", "Database SSL mode (disable, prefer, require)")

	// Parse flags
	flag.Parse()

	// Ensure required database flags are set
	if *dbName == "" || *dbUser == "" {
		fmt.Println("Missing required database flags")
		os.Exit(1)
	}

	// Set application config
	app.InProduction = *inProduction
	app.UseCache = *useCache

	// Set up logging
	infoLog = log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog = log.New(os.Stdout, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)
	app.InfoLog = infoLog
	app.ErrorLog = errorLog

	// Configure session management
	session = scs.New()
	session.Lifetime = 24 * time.Hour
	session.Cookie.Persist = true
	session.Cookie.SameSite = http.SameSiteLaxMode
	session.Cookie.Secure = app.InProduction
	app.Session = session

	// Connect to the database
	log.Println("Connecting to database...")
	connectionString := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=%s",
		*dbHost, *dbPort, *dbName, *dbUser, *dbPass, *dbSSL,
	)
	db, err := driver.ConnectSQL(connectionString)
	if err != nil {
		log.Fatal("Cannot connect to database! Exiting...")
	}
	log.Println("Connected to database!")

	// Create template cache
	tc, err := render.CreateTemplateCache()
	if err != nil {
		log.Fatal("Cannot create template cache")
		return nil, err
	}
	app.TemplateCache = tc

	// Initialize handlers and utilities
	repo := handlers.NewRepo(&app, db)
	handlers.NewHandlers(repo)
	render.NewRenderer(&app)
	helpers.NewHelpers(&app)

	return db, nil
}
