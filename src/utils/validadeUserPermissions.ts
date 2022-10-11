type User = {
  permissions: string[];
  roles: string[];
}

type ValidateUserPermissionsParams = {
  user: User;
  permissions?: string[];
  roles?: string[];
}

export function validadeUserPermissions({
  user,
  permissions,
  roles
}: ValidateUserPermissionsParams){
  if(permissions?.length > 0) {
    //.every => retorna true se todas as condições que eu colocar dentro da 
    //função estiverem satisfeitas.
    const hasAllPermissions = permissions.every(permission => {
      return user.permissions.includes(permission);
    })

    if(!hasAllPermissions) {
      return false;
    }

  }

  if(roles?.length > 0) {
    const hasAllRoles = roles.every(role => {
      return user.roles.includes(role);
    })

    if(!hasAllRoles) {
      return false;
    }

  }

  return true;
}