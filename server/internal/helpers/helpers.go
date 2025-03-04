package helpers

import (
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/mcgigglepop/firestream/server/internal/config"
)

var app *config.AppConfig

// NewHelpers sets up app config for helpers
func NewHelpers(a *config.AppConfig) {
	app = a
}

// ClientError is a helper that logs a client error
func ClientError(w http.ResponseWriter, status int) {
	app.InfoLog.Println("Client error with status of", status)
	http.Error(w, http.StatusText(status), status)
}

// ServerError is a helper that logs a server error
func ServerError(w http.ResponseWriter, err error) {
	trace := fmt.Sprintf("%s\n%s", err.Error(), debug.Stack())
	app.ErrorLog.Println(trace)
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
}

// IsAuthenticated is a helper that checks if a "user_id" is in the current app session
func IsAuthenticated(r *http.Request) bool {
	exists := app.Session.Exists(r.Context(), "user_id")
	return exists
}
