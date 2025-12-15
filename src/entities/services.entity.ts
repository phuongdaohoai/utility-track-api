import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ServiceUsageHistories } from "./service-usage-histories.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__services__3213E83FE3D2C8D4", ["id"], { unique: true })
@Entity("services", { schema: "dbo" })
export class Services extends BaseEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("nvarchar", { name: "service_name", length: 100 })
  serviceName: string;

  @Column("int", { name: "capacity" })
  capacity: number;

  @Column("nvarchar", { name: "description", nullable: true, length: 255 })
  description: string | null;

  @Column("decimal", {
    name: "price",
    nullable: true,
    precision: 18,
    scale: 2,
    default: () => "(0)",
  })
  price: number | null;

  @Column("int", { name: "status", nullable: true, default: () => "(1)" })
  status: number | null;

  @OneToMany(
    () => ServiceUsageHistories,
    (serviceUsageHistories) => serviceUsageHistories.service
  )
  serviceUsageHistories: ServiceUsageHistories[];
}
