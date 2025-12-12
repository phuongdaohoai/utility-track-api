import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Permissions } from "./permissions.entity";
import { Staff } from "./staff.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__Roles__8AFACE1AB26D054D", ["roleId"], { unique: true })
@Index("UQ__Roles__8A2B61602ED56133", ["roleName"], { unique: true })
@Entity("Roles", { schema: "dbo" })
export class Roles extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "RoleId" })
  roleId: number;

  @Column("varchar", { name: "RoleName", unique: true, length: 50 })
  roleName: string;

  @ManyToMany(() => Permissions, (permissions) => permissions.roles)
  @JoinTable({
    name: "RolePermissions",
    joinColumns: [{ name: "RoleId", referencedColumnName: "roleId" }],
    inverseJoinColumns: [
      { name: "PermissionId", referencedColumnName: "permissionId" },
    ],
    schema: "dbo",
  })
  permissions: Permissions[];

  @OneToMany(() => Staff, (staff) => staff.role)
  staff: Staff[];
}
