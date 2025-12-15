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
import { Staffs } from "./staffs.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__roles__3213E83FD2F45E95", ["id"], { unique: true })
@Index("UQ__roles__783254B15DF38CF2", ["roleName"], { unique: true })
@Entity("roles", { schema: "dbo" })
export class Roles extends BaseEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "role_name", unique: true, length: 50 })
  roleName: string;


  @ManyToMany(() => Permissions, (permissions) => permissions.roles)
  @JoinTable({
    name: "role_permissions",
    joinColumns: [{ name: "role_id", referencedColumnName: "id" }],
    inverseJoinColumns: [{ name: "permission_id", referencedColumnName: "id" }],
    schema: "dbo",
  })
  permissions: Permissions[];

  @OneToMany(() => Staffs, (staffs) => staffs.role)
  staffs: Staffs[];
}
