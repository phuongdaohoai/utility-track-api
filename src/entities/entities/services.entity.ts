import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ServiceUsageHistory } from "./service-usage-history.entity";

@Index("PK__Services__C51BB00A5C40BF2D", ["serviceId"], { unique: true })
@Entity("Services", { schema: "dbo" })
export class Services {
  @PrimaryGeneratedColumn({ type: "int", name: "ServiceId" })
  serviceId: number;

  @Column("nvarchar", { name: "ServiceName", length: 100 })
  serviceName: string;

  @Column("int", { name: "Capacity" })
  capacity: number;

  @Column("nvarchar", { name: "Description", nullable: true, length: 255 })
  description: string | null;

  @Column("decimal", {
    name: "Price",
    nullable: true,
    precision: 18,
    scale: 2,
    default: () => "(0)",
  })
  price: number | null;

  @Column("int", { name: "Status", nullable: true, default: () => "(1)" })
  status: number | null;

  @OneToMany(
    () => ServiceUsageHistory,
    (serviceUsageHistory) => serviceUsageHistory.service
  )
  serviceUsageHistories: ServiceUsageHistory[];
}
