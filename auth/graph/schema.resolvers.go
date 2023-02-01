package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"
	"main/graph/generated"
	"main/graph/model"
	"main/services/auth"
)

// Register is the resolver for the register field.
func (r *mutationResolver) Register(ctx context.Context, user model.UserInput) (*model.RegisteredResponse, error) {
	auth.Register(user.Name, user.Email, user.Password)
	var res = model.RegisteredResponse{Status: "registered"}
	return &res, nil
}

// Login is the resolver for the login field.
func (r *mutationResolver) Login(ctx context.Context, user model.UserInput) (*model.LoginResponse, error) {
	return auth.Login(user)
}

// User is the resolver for the user field.
func (r *queryResolver) User(ctx context.Context, email string, password *int) (*model.User, error) {
	panic(fmt.Errorf("not implemented: User - user"))
}

// LoginUser is the resolver for the loginUser field.
func (r *queryResolver) LoginUser(ctx context.Context, uuid string) (*model.Login, error) {
	return auth.LoginUser(uuid)
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
