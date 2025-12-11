import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CheckInOut } from "./check-in-out.entity";
import { ServiceUsageHistory } from "./service-usage-history.entity";
import { Roles } from "./roles.entity";

@Index("PK__Staff__96D4AB17CFEED688", ["staffId"], { unique: true })
@Index("UQ__Staff__A9D10534EE2F6684", ["email"], { unique: true })
@Entity("Staff", { schema: "dbo" })
export class Staff {
  @PrimaryGeneratedColumn({ type: "int", name: "StaffId" })
  staffId: number;

  @Column("nvarchar", { name: "FullName", length: 100 })
  fullName: string;

  @Column("varchar", { name: "Phone", nullable: true, length: 15 })
  phone: string | null;

  @Column("varchar", { name: "Email", unique: true, length: 50 })
  email: string;

  @Column("varchar", { name: "PasswordHash", length: 255 })
  passwordHash: string;

  @Column("int", { name: "Status", nullable: true, default: () => "(1)" })
  status: number | null;

  @Column("nvarchar", { name: "Avatar", nullable: true })
  avatar: string | null;

  @Column("int", { name: "RoleId", nullable: true })
  roleId: number | null;

  @OneToMany(() => CheckInOut, (checkInOut) => checkInOut.staff)
  checkInOuts: CheckInOut[];

  @OneToMany(
    () => ServiceUsageHistory,
    (serviceUsageHistory) => serviceUsageHistory.staff
  )
  serviceUsageHistories: ServiceUsageHistory[];

  @ManyToOne(() => Roles, (roles) => roles.staff)
  @JoinColumn([{ name: "RoleId", referencedColumnName: "roleId" }])
  role: Roles;
}
