package auth

import (
	"errors"
	"github.com/google/uuid"
	_ "github.com/google/uuid"
	"main/graph/model"
)

type Message struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

var users = []model.User{
	{"demo", "demo@gmail.com", "demo"},
	{"remi", "zefs", "1234"},
}

var login []model.Login

func Register(name string, email string, password string) model.User {
	var user = model.User{
		Name:     name,
		Email:    email,
		Password: password,
	}

	users = append(users, user)

	return user
}

func Login(identifier model.UserInput) (*model.LoginResponse, error) {
	for _, user := range users {
		if (user.Email == identifier.Email || user.Name == identifier.Name) && user.Password == identifier.Password {
			uuidLogin := uuid.New().String()
			newLogin := model.Login{
				User: &user,
				UUID: uuidLogin,
			}
			login = append(login, newLogin)
			var res = model.LoginResponse{UUID: uuidLogin}
			return &res, nil
		}
	}

	return nil, errors.New("user not found")
}

func LoginUser(uuid string) (*model.Login, error) {
	for _, userObj := range login {
		if userObj.UUID == uuid {
			return &userObj, nil
		}
	}
	return nil, errors.New("user not log")
}
