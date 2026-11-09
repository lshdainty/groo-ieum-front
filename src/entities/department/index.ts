// Department Entity - Public API

// Types
export type {
  PostDepartmentReq,
  PostDepartmentResp,
  PutDepartmentReq,
  GetDepartmentResp,
  GetDepartmentWithChildrenResp,
  UserInfo,
  GetDepartmentUsersResp,
  UserDepartmentInfo,
  PostDepartmentUsersReq,
  PostDepartmentUsersResp,
  DeleteDepartmentUsersReq,
  CheckUserMainDepartmentResp,
} from '@/entities/department/model/types'

// API
export { departmentApi } from '@/entities/department/api/departmentApi'

// Queries
export {
  useDepartmentQuery,
  useDepartmentWithChildrenQuery,
  useDepartmentUsersQuery,
  useCheckUserMainDepartmentQuery,
  usePostDepartmentMutation,
  usePutDepartmentMutation,
  useDeleteDepartmentMutation,
  usePostDepartmentUsersMutation,
  useDeleteDepartmentUsersMutation,
  usePutMainDepartmentMutation,
} from '@/entities/department/api/departmentQueries'
