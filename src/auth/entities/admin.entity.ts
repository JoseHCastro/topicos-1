import { ChildEntity } from 'typeorm';
import { User } from './user.entity';

@ChildEntity()
export class Admin extends User {
  // Admin entity inherits all properties from User
  // No additional properties needed for now
}
