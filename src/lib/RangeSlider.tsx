import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface RangeSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  formatValue?: (value: number) => string;
  showValues?: boolean;
  className?: string;
  marks?: { value: number; label: string }[];
}

export const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ className, formatValue, showValues = true, marks, ...props }, ref) => {
  const formatDisplayValue = formatValue || ((value: number) => value.toString());
  
  return (
    <div className="w-full space-y-2">
      {showValues && props.value && Array.isArray(props.value) && (
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {formatDisplayValue(props.value[0])}
          </span>
          {props.value.length > 1 && (
            <span className="font-medium">{formatDisplayValue(props.value[1])}</span>
          )}
        </div>
      )}
      
      <div className="relative"> {/* Added a relative container to properly scope marks */}
        <SliderPrimitive.Root
          ref={ref}
          className={`relative flex w-full touch-none select-none items-center ${className}`}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
            <SliderPrimitive.Range className="absolute h-full bg-[#f74f4f]" />
          </SliderPrimitive.Track>
          
          {props.value && Array.isArray(props.value) && 
            props.value.map((_, index) => (
              <SliderPrimitive.Thumb
                key={index}
                className="block h-5 w-5 rounded-full border-2 border-[#f74f4f] bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f74f4f] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              />
            ))
          }
          
          {marks && (
            <div className="absolute inset-x-0 top-1/2 -mt-0.5 pointer-events-none">
              {marks.map((mark) => (
                <div
                  key={mark.value}
                  className="absolute top-0 -translate-x-1/2 h-1 w-1 rounded-full bg-gray-400"
                  style={{
                    left: `${((mark.value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100}%`,
                  }}
                />
              ))}
            </div>
          )}
        </SliderPrimitive.Root>
        
        {/* Mark labels in a contained way */}
        {marks && (
          <div className="relative w-full h-6 mt-1">
            {marks.map((mark) => (
              <span 
                key={mark.value}
                className="absolute text-xs text-gray-500 transform -translate-x-1/2"
                style={{
                  left: `${((mark.value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100}%`,
                  top: 0,
                }}
              >
                {mark.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

RangeSlider.displayName = "RangeSlider";