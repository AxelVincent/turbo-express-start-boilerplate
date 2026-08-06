import { BaseUser, type BaseUserConstructorArgs } from "./base_user"
import { OrgsUser } from "./domains/orgs_user"
import { AuthUser } from "./domains/auth_user"
import { MeUser } from "./domains/me_user"

export class User extends BaseUser {
  private readonly _orgs: OrgsUser
  private readonly _auth: AuthUser
  private readonly _me: MeUser

  constructor(args: BaseUserConstructorArgs = {}) {
    super(args)
    this._orgs = new OrgsUser(this)
    this._auth = new AuthUser(this)
    this._me = new MeUser(this)
  }

  get orgs(): OrgsUser {
    return this._orgs
  }
  get auth(): AuthUser {
    return this._auth
  }
  get me(): MeUser {
    return this._me
  }

  copy(overrides: Partial<BaseUserConstructorArgs>): User {
    const copy = Object.create(this)
    Object.assign(copy, overrides)
    return copy
  }
}
