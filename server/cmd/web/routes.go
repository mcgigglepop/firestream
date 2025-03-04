package main

import (
	"net/http"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/mcgigglepop/firestream/server/internal/config"
	"github.com/mcgigglepop/firestream/server/internal/handlers"
)

func routes(app *config.AppConfig) http.Handler {
	mux := chi.NewRouter()

	mux.Use(middleware.Recoverer)
	mux.Use(NoSurf)
	mux.Use(SessionLoad)

	// index
	mux.Get("/", handlers.Repo.Index)

	mux.Get("/signup", handlers.Repo.SignUp)
	mux.Get("/login", handlers.Repo.Login)

	fileServer := http.FileServer(http.Dir("./static/"))
	mux.Handle("/static/*", http.StripPrefix("/static", fileServer))

	return mux
}