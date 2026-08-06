import { createTestRouter } from "../../../../routes_tests/utils/create_test_router"
import { getUsersReturnsList } from "./get_users_returns_list"
import { getUserById } from "./get_user_by_id"
import { createUserSucceeds } from "./create_user_succeeds"
import { updateUserRole } from "./update_user_role"
import { deleteUserSucceeds } from "./delete_user_succeeds"

const router = createTestRouter({
  "/get_users_returns_list": getUsersReturnsList,
  "/get_user_by_id": getUserById,
  "/create_user_succeeds": createUserSucceeds,
  "/update_user_role": updateUserRole,
  "/delete_user_succeeds": deleteUserSucceeds,
})

export default ["/users", router]
