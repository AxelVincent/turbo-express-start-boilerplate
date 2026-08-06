import { createIntegrationTestSuite } from "../../../../tests/utils/create_integration_test_suite"

createIntegrationTestSuite(
  { name: "users", routePrefix: "/users" },
  {
    when: "an authenticated user requests the users list",
    then: "they receive a paginated list of users",
    route: "/get_users_returns_list",
  },
  {
    when: "an authenticated user requests a specific user by id",
    then: "they receive the user details",
    route: "/get_user_by_id",
  },
  {
    when: "an authenticated user creates a new user",
    then: "the user is created and returned",
    route: "/create_user_succeeds",
  },
  {
    when: "an authenticated user updates a user role",
    then: "the role is updated successfully",
    route: "/update_user_role",
  },
  {
    when: "an authenticated user deletes a user",
    then: "the user is removed",
    route: "/delete_user_succeeds",
  },
)
