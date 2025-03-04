package handlers

import (
	"net/http"

	"github.com/mcgigglepop/firestream/server/internal/config"
	"github.com/mcgigglepop/firestream/server/internal/driver"
	"github.com/mcgigglepop/firestream/server/internal/models"
	"github.com/mcgigglepop/firestream/server/internal/render"
	"github.com/mcgigglepop/firestream/server/internal/repository"
	"github.com/mcgigglepop/firestream/server/internal/repository/dbrepo"
)

// repository used by the handlers
var Repo *Repository

// the repository type
type Repository struct {
	App *config.AppConfig
	DB  repository.DatabaseRepo
}

// NewRepo creates a new repository
func NewRepo(a *config.AppConfig, db *driver.DB) *Repository {
	return &Repository{
		App: a,
		DB:  dbrepo.NewPostgresRepo(db.SQL, a),
	}
}

// NewHandlers sets the repository for the handlers
func NewHandlers(r *Repository) {
	Repo = r
}

// Index is the home/index page handler
func (m *Repository) Index(w http.ResponseWriter, r *http.Request) {
	render.Template(w, r, "index.page.tmpl", &models.TemplateData{})
}

// SignUp is the signup/register page handler
func (m *Repository) SignUp(w http.ResponseWriter, r *http.Request) {
	render.Template(w, r, "signup.page.tmpl", &models.TemplateData{})
}

// Login is the login page handler
func (m *Repository) Login(w http.ResponseWriter, r *http.Request) {
	render.Template(w, r, "login.page.tmpl", &models.TemplateData{})
}

// Dashboard is the login page handler
func (m *Repository) Dashboard(w http.ResponseWriter, r *http.Request) {
	render.Template(w, r, "dashboard.page.tmpl", &models.TemplateData{})
}