import { AuthRepository } from "@/src/features/auth/data/AuthRepository";
import { CreateRepository } from "@/src/features/create/data/CreateRepository";
import { ExploreRepository } from "@/src/features/explore/data/ExploreRepository";
import { HomeRepository } from "@/src/features/home/data/HomeRepository";
import { ProfileRepository } from "@/src/features/profile/data/ProfileRepository";
import { ProjectRepository } from "@/src/features/project/data/ProjectRepository";
import { WorkspaceRepository } from "@/src/features/workspace/data/WorkspaceRepository";
import { robleService } from "@/src/core/roble/service";
import { Container } from "./container";
import { TOKENS } from "./tokens";

export function createAppContainer(): Container {
  const c = new Container();

  c.register(TOKENS.Roble, robleService)
    .register(TOKENS.AuthRepo, new AuthRepository(robleService))
    .register(TOKENS.HomeRepo, new HomeRepository(robleService))
    .register(TOKENS.ExploreRepo, new ExploreRepository(robleService))
    .register(TOKENS.ProjectRepo, new ProjectRepository(robleService))
    .register(TOKENS.CreateRepo, new CreateRepository(robleService))
    .register(TOKENS.ProfileRepo, new ProfileRepository(robleService))
    .register(TOKENS.WorkspaceRepo, new WorkspaceRepository(robleService));

  return c;
}
