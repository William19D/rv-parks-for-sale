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
      
      <div className="relative w-full pt-1 pb-6">
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
        </SliderPrimitive.Root>
        
        {marks && (
          <div className="absolute bottom-0 left-0 right-0 h-5 pointer-events-none">
            {marks.map((mark) => {
              // Calculate the percentage position
              const percentage = ((mark.value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100;
              
              return (
                <div
                  key={mark.value}
                  className="absolute"
                  style={{
                    left: `${percentage}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="text-xs text-gray-500">
                    {mark.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

RangeSlider.displayName = "RangeSlider";