import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsEqualTo(property: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    const propertyNameString = typeof propertyName === 'string' ? propertyName : propertyName.toString();
    registerDecorator({
      name: 'isEqualTo',
      target: object.constructor,
      propertyName: propertyNameString,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}
