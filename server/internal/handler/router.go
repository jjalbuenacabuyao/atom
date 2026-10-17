package handler

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"atom/internal/apperr"
	"atom/internal/config"
	"atom/internal/middleware"
	"atom/internal/repository"
	"atom/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

// NewRouter builds the Gin engine with all middleware and routes.
func NewRouter(cfg config.Config, db *gorm.DB, log *slog.Logger) (*gin.Engine, error) {
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	} else if cfg.Env == config.EnvTest {
		gin.SetMode(gin.TestMode)
	}
	useJSONFieldNames()

	// Repositories → services → handlers.
	userRepo := repository.NewUsers(db)
	identityRepo := repository.NewIdentities(db)
	habitRepo := repository.NewHabits(db)
	scorecardRepo := repository.NewScorecard(db)

	authSvc := service.NewAuth(userRepo, cfg.JWTSecret, cfg.SessionTTL)
	habitSvc := service.NewHabits(habitRepo, identityRepo)
	identitySvc := service.NewIdentities(identityRepo, habitRepo)
	scorecardSvc := service.NewScorecard(scorecardRepo)
	dashboardSvc := service.NewDashboard(habitSvc, identitySvc)

	authH := &AuthHandler{auth: authSvc, cookieSecure: cfg.CookieSecure}
	habitH := &HabitHandler{habits: habitSvc}
	identityH := &IdentityHandler{identities: identitySvc}
	scorecardH := &ScorecardHandler{scorecard: scorecardSvc}
	dashboardH := &DashboardHandler{dashboard: dashboardSvc}

	r := gin.New()
	r.HandleMethodNotAllowed = true
	// Only trust X-Forwarded-For from explicitly configured proxies.
	if err := r.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		return nil, err
	}
	r.Use(
		middleware.RequestID(),
		middleware.Logger(log),
		middleware.Recovery(log),
		middleware.SecurityHeaders(),
		middleware.BodyLimit(),
	)
	if len(cfg.AllowedOrigins) > 0 {
		r.Use(cors.New(cors.Config{
			AllowOrigins:     cfg.AllowedOrigins,
			AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete},
			AllowHeaders:     []string{"Content-Type", middleware.CSRFHeader},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}))
	}
	r.NoRoute(func(c *gin.Context) { middleware.Abort(c, apperr.ErrNotFound) })
	r.NoMethod(func(c *gin.Context) {
		middleware.Abort(c, &apperr.Error{Status: http.StatusMethodNotAllowed, Code: "method_not_allowed", Message: "Method not allowed"})
	})

	// Health probes for orchestrators: liveness and readiness.
	r.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	r.GET("/readyz", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		sqlDB, err := db.DB()
		if err == nil {
			err = sqlDB.PingContext(ctx)
		}
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1", middleware.CSRF(cfg.CookieSecure))

	auth := api.Group("/auth")
	{
		limited := auth.Group("", middleware.RateLimit(rate.Every(6*time.Second), 10))
		limited.POST("/register", wrap(authH.register))
		limited.POST("/login", wrap(authH.login))
		auth.POST("/logout", wrap(authH.logout))
		auth.GET("/me", middleware.RequireAuth(authSvc), wrap(authH.me))
	}

	protected := api.Group("", middleware.RequireAuth(authSvc))

	protected.GET("/dashboard", wrap(dashboardH.get))

	identities := protected.Group("/identities")
	{
		identities.GET("", wrap(identityH.list))
		identities.POST("", wrap(identityH.create))
		identities.PUT("/:id", wrap(identityH.update))
		identities.DELETE("/:id", wrap(identityH.delete))
	}

	habits := protected.Group("/habits")
	{
		habits.GET("", wrap(habitH.list))
		habits.POST("", wrap(habitH.create))
		habits.PUT("/order", wrap(habitH.reorder))
		habits.GET("/:id", wrap(habitH.get))
		habits.PUT("/:id", wrap(habitH.update))
		habits.DELETE("/:id", wrap(habitH.delete))
		habits.POST("/:id/archive", wrap(habitH.archive))
		habits.POST("/:id/restore", wrap(habitH.restore))
		habits.GET("/:id/logs", wrap(habitH.logs))
		habits.PUT("/:id/logs/:date", wrap(habitH.check))
		habits.DELETE("/:id/logs/:date", wrap(habitH.uncheck))
	}

	scorecard := protected.Group("/scorecard")
	{
		scorecard.GET("", wrap(scorecardH.list))
		scorecard.POST("", wrap(scorecardH.create))
		scorecard.PUT("/:id", wrap(scorecardH.update))
		scorecard.DELETE("/:id", wrap(scorecardH.delete))
	}

	return r, nil
}
