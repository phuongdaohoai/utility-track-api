import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Residents } from "./residents.entity";

@Index("PK__Apartmen__CBDF5764E15EA026", ["apartmentId"], { unique: true })
@Entity("Apartments", { schema: "dbo" })
export class Apartments {
  @PrimaryGeneratedColumn({ type: "int", name: "ApartmentId" })
  apartmentId: number;

  @Column("varchar", { name: "Building", length: 20 })
  building: string;

  @Column("varchar", { name: "RoomNumber", length: 20 })
  roomNumber: string;

  @OneToMany(() => Residents, (residents) => residents.apartment)
  residents: Residents[];
}
