import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectName: string;
    onProjectNameChange: (name: string) => void;
    onCreate: () => void;
}

export const CreateProjectDialog = ({
    open,
    onOpenChange,
    projectName,
    onProjectNameChange,
    onCreate,
}: CreateProjectDialogProps) => {
    const isMobile = useIsMobile();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onCreate();
    };

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    className="max-h-[90vh] h-auto rounded-t-xl flex flex-col"
                >
                    <SheetHeader className="flex-shrink-0">
                        <SheetTitle>New Project</SheetTitle>
                        <SheetDescription>
                            Create a new project to start designing
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 flex flex-col min-h-0 py-4">
                        <Input
                            placeholder="Project name"
                            value={projectName}
                            onChange={(e) => onProjectNameChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="text-foreground bg-background"
                        />
                    </div>
                    <SheetFooter className="flex-shrink-0 flex-col gap-2 sm:flex-row">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button onClick={onCreate} disabled={!projectName.trim()} className="w-full sm:w-auto">
                            Create
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Project</DialogTitle>
                    <DialogDescription>
                        Create a new project to start designing
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        placeholder="Project name"
                        value={projectName}
                        onChange={(e) => onProjectNameChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onCreate} disabled={!projectName.trim()}>
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
