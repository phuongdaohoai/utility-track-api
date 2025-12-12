import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Roles } from "./roles.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__Permissi__EFA6FB2F3D562EAB", ["permissionId"], { unique: true })
@Entity("Permissions", { schema: "dbo" })
export class Permissions extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "PermissionId" })
  permissionId: number;

  @Column("varchar", { name: "Module", length: 50 })
  module: string;

  @Column("varchar", { name: "Action", length: 20 })
  action: string;

  @ManyToMany(() => Roles, (roles) => roles.permissions)
  roles: Roles[];
}
