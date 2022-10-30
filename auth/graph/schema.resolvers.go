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
	userRes := auth.Register(user.Name, user.Email, user.Password)
	if userRes != nil {
		var res = model.RegisteredResponse{Status: "registered"}
		return &res, nil
	} else {
		var res = model.RegisteredResponse{Status: "error"}
		return &res, nil
	}
}

// User is the resolver for the user field.
func (r *queryResolver) User(ctx context.Context, email string, password *int) (*model.User, error) {
	panic(fmt.Errorf("not implemented: User - user"))
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
