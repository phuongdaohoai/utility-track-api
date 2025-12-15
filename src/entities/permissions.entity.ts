import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Roles } from "./roles.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__permissi__3213E83F69DDDDC0", ["id"], { unique: true })
@Entity("permissions", { schema: "dbo" })
export class Permissions extends BaseEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "module", length: 50 })
  module: string;

  @Column("varchar", { name: "action", length: 20 })
  action: string;


  @ManyToMany(() => Roles, (roles) => roles.permissions)
  roles: Roles[];
}
