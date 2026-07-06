declare module '@radix-ui/react-aspect-ratio' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
}

declare module 'react-day-picker' {
  export const DayPicker: React.ForwardRefExoticComponent<any>;
  export const DayButton: React.ForwardRefExoticComponent<any>;
  export function getDefaultClassNames(): Record<string, string>;
}

declare module 'embla-carousel-react' {
  type UseEmblaCarouselType = [any, any];
  export type { UseEmblaCarouselType };
  const useEmblaCarousel: (...args: any[]) => UseEmblaCarouselType;
  export default useEmblaCarousel;
  export type EmblaCarouselType = any;
  export type EmblaOptionsType = any;
  export type EmblaPluginType = any;
}

declare module 'cmdk' {
  interface CommandStatic {
    new (): any;
    Input: React.ForwardRefExoticComponent<any>;
    List: React.ForwardRefExoticComponent<any>;
    Empty: React.ForwardRefExoticComponent<any>;
    Group: React.ForwardRefExoticComponent<any>;
    Separator: React.ForwardRefExoticComponent<any>;
    Item: React.ForwardRefExoticComponent<any>;
    Dialog: React.ForwardRefExoticComponent<any>;
  }
  export const Command: React.ForwardRefExoticComponent<any> & CommandStatic;
}

declare module '@radix-ui/react-context-menu' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Portal: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const CheckboxItem: React.ForwardRefExoticComponent<any>;
  export const RadioGroup: React.ForwardRefExoticComponent<any>;
  export const RadioItem: React.ForwardRefExoticComponent<any>;
  export const Separator: React.ForwardRefExoticComponent<any>;
  export const Label: React.ForwardRefExoticComponent<any>;
  export const Sub: React.ForwardRefExoticComponent<any>;
  export const SubTrigger: React.ForwardRefExoticComponent<any>;
  export const SubContent: React.ForwardRefExoticComponent<any>;
  export const Group: React.ForwardRefExoticComponent<any>;
  export const ItemIndicator: React.ForwardRefExoticComponent<any>;
}

declare module 'vaul' {
  interface DrawerStatic {
    Root: React.ForwardRefExoticComponent<any>;
    Trigger: React.ForwardRefExoticComponent<any>;
    Portal: React.ForwardRefExoticComponent<any>;
    Close: React.ForwardRefExoticComponent<any>;
    Overlay: React.ForwardRefExoticComponent<any>;
    Content: React.ForwardRefExoticComponent<any>;
    Title: React.ForwardRefExoticComponent<any>;
    Description: React.ForwardRefExoticComponent<any>;
    Header: React.ForwardRefExoticComponent<any>;
    Footer: React.ForwardRefExoticComponent<any>;
  }
  export const Drawer: React.ForwardRefExoticComponent<any> & DrawerStatic;
}

declare module 'react-hook-form' {
  export const useForm: any;
  export const useFormContext: any;
  export const useFormField: any;
  export const FormProvider: React.ForwardRefExoticComponent<any>;
  export const Controller: any;
  export type FieldValues = Record<string, any>;
  export type FieldPath<TFieldValues extends FieldValues = FieldValues> = string;
  export type ControllerProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = any;
  export const FormFieldContext: any;
  export const FormItemContext: any;
}

declare module '@radix-ui/react-menubar' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Portal: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const CheckboxItem: React.ForwardRefExoticComponent<any>;
  export const RadioGroup: React.ForwardRefExoticComponent<any>;
  export const RadioItem: React.ForwardRefExoticComponent<any>;
  export const Separator: React.ForwardRefExoticComponent<any>;
  export const Label: React.ForwardRefExoticComponent<any>;
  export const Sub: React.ForwardRefExoticComponent<any>;
  export const SubTrigger: React.ForwardRefExoticComponent<any>;
  export const SubContent: React.ForwardRefExoticComponent<any>;
  export const Group: React.ForwardRefExoticComponent<any>;
  export const ItemIndicator: React.ForwardRefExoticComponent<any>;
  export const Menu: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-navigation-menu' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const List: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const Trigger: React.ForwardRefExoticComponent<any>;
  export const Content: React.ForwardRefExoticComponent<any>;
  export const Link: React.ForwardRefExoticComponent<any>;
  export const Indicator: React.ForwardRefExoticComponent<any>;
  export const Viewport: React.ForwardRefExoticComponent<any>;
}

declare module '@radix-ui/react-radio-group' {
  export const Root: React.ForwardRefExoticComponent<any>;
  export const Item: React.ForwardRefExoticComponent<any>;
  export const Indicator: React.ForwardRefExoticComponent<any>;
}

declare module 'react-resizable-panels' {
  export const PanelGroup: React.ForwardRefExoticComponent<any>;
  export const Panel: React.ForwardRefExoticComponent<any>;
  export const PanelResizeHandle: React.ForwardRefExoticComponent<any>;
}
